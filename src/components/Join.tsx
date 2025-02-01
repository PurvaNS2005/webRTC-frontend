import { FormEvent, useState, useEffect, useRef } from "react"

const Join = () => {
    const socketRef = useRef<WebSocket | null>(null)
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
    const [isInRoom, setIsInRoom] = useState(false)
    const [hostId, setHostId] = useState<string>("")
    const [userId, setUserId] = useState<string>("")

    useEffect(() => {
        socketRef.current = new WebSocket('ws://localhost:8080')
        const socket = socketRef.current

        socket.onopen = () => {
            console.log(`connected to server 8080`)
        }

        socket.onerror = (err) => {
            console.error(`websocket error `, err)
        }

        socket.onmessage = (e) => {
            const message = JSON.parse(e.data)
            console.log(`message : ${e.data}`)
            if(message.type === 'userId') {
                setUserId(message.userId)
                console.log(`set user id to ${message.userId}`)
            } else if(message.type === 'create-answer') {
                const pc = peerConnectionRef.current
                pc?.setRemoteDescription(message.answer)
                setIsInRoom(true)
                console.log(`answer recieved and set remote description ${message.answer}`)
            } else if(message.type === 'ice-candidate') {
                const pc = peerConnectionRef.current
                pc?.addIceCandidate(new RTCIceCandidate(message.candidate))
                console.log(`recieved new ice candidate ${message.candidate}`)
            }
        }
    }, [])

    const handleJoinRoom = async (e : FormEvent) => {
        e.preventDefault() 
        const socket = socketRef.current
        if(!socket) {
            return;
        }
        peerConnectionRef.current = new RTCPeerConnection()
        const pc = peerConnectionRef.current

        pc.onicecandidate = (e) => {
            console.log(`sending new ice candidate ${e.candidate}`)
            if(e.candidate) {
                socket.send(JSON.stringify({ type : "ice-candidate", candidate : e.candidate }))
            }
        }

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.send(JSON.stringify({ type : 'join-room', hostId, offer}))
        console.log(`offer sent ${JSON.stringify(offer)}`)
    }

    return(
        <div className="flex flex-col items-center justify-center min-h-screen w-full p-4 bg-gray-100">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
                <form className="flex flex-col space-y-4" onSubmit={handleJoinRoom}>
                    <input 
                        type="text" 
                        placeholder="Enter host ID"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={hostId}
                        onChange={e => setHostId(e.target.value)}
                        required
                    />
                    <button
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isInRoom}
                    >
                        Join Room
                    </button>
                </form>
            </div>
    
            {isInRoom && (
                <div className="mt-8 w-full max-w-md bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-semibold mb-4">Room Information</h2>
                    <p className="text-gray-700 mb-4">Host ID: <span className="font-medium">{hostId}</span></p>
                    <button className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-300 ease-in-out">
                        Send File
                    </button>
                </div>
            )}
</div>
    )
}

export default Join
import React, { useEffect, useState, useRef } from 'react'
import '../App.css'
import io from 'socket.io-client'
import Peer from 'simple-peer'

function VideoComponent({ socket, selectedUser, currentUser, startCall }) {
  const [yourID, setYourID] = useState('')
  const [users, setUsers] = useState({})
  const [stream, setStream] = useState()
  const [receivingCall, setReceivingCall] = useState(false)
  const [caller, setCaller] = useState('')
  const [callerSignal, setCallerSignal] = useState()
  const [callAccepted, setCallAccepted] = useState(false)

  const userVideo = useRef()
  const partnerVideo = useRef()

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream)
      })

    socket.on('hey', (data) => {
      console.log('Accept Call')
      setReceivingCall(true)
      setCaller(data.from)
      setCallerSignal(data.signal)
    })
  }, [])

  useEffect(() => {
    if (startCall) { 
      callPeer(selectedUser._id)
      if (userVideo.current) {
        userVideo.current.srcObject = stream
      }
    }
  }, [startCall])

  function callPeer(id) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      config: {
        iceServers: [
          {
            urls: 'stun:numb.viagenie.ca',
            username: 'sultan1640@gmail.com',
            credential: '98376683',
          },
          {
            urls: 'turn:numb.viagenie.ca',
            username: 'sultan1640@gmail.com',
            credential: '98376683',
          },
        ],
      },
      stream: stream,
    })

    peer.on('signal', (data) => {
      socket.emit('callUser', {
        userToCall: id,
        signalData: data,
        from: currentUser._id,
      })
      console.log('Start Call')
    })

    peer.on('stream', (stream) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = stream
        console.log('Partner Stream')
      }
    })

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true)
      peer.signal(signal)
      console.log('Call Accepted')
    })
  }

  function acceptCall() {
    setCallAccepted(true)
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    })
    peer.on('signal', (data) => {
      socket.emit('acceptCall', { signal: data, to: caller })
    })

    peer.on('stream', (stream) => {
      partnerVideo.current.srcObject = stream
    })

    peer.signal(callerSignal)
    setReceivingCall(false)
  }

  let UserVideo
  if (stream && startCall) {
    UserVideo = <video playsInline muted ref={userVideo} autoPlay />
  }

  let PartnerVideo
  if (callAccepted) {
    PartnerVideo = <video playsInline muted ref={partnerVideo} autoPlay />
  }

  let incomingCall
  if (receivingCall) {
    incomingCall = (
      <div>
        <h1>{selectedUser.firstName} is calling you</h1>
        <button onClick={acceptCall}>Accept</button>
      </div>
    )
  }
  return (
    <div>
      <div>
        {UserVideo}
        {PartnerVideo}
      </div>
      <div>
        {Object.keys(users).map((key) => {
          if (key === yourID) {
            return null
          }
          return <button onClick={() => callPeer(key)}>Call {key}</button>
        })}
      </div>
      <div>{incomingCall}</div>
    </div>
  )
}

export default VideoComponent

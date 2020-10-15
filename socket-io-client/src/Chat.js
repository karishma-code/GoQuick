import React, { useEffect, useState, useRef } from 'react'
import SendIcon from './assets/curve-left-arrow.png'
import VideoCallIcon from './assets/videoCall.png'
import Api from './Api'
import VideoComponent from './screens/VideoComponent'

const ShowChat = (props) => {
  const {
    token,
    selectedUser,
    currentUser,
    socket,
    roomId,
    setRoomId,
    newMessage,
    setNewMessage,
    markAsRead,
  } = props
  const [message, setMessage] = useState('')
  const [conversation, setConversation] = useState([])
  const [showVideoCall, setShowVideoCall] = useState(false)

  useEffect(() => {
    if (newMessage && newMessage.chatRoomId === roomId)
      setConversation([...conversation, newMessage])
  }, [newMessage])

  useEffect(() => {
    if (roomId !== '') {
      socket.emit('subscribe', roomId, selectedUser._id)
      markAsRead()
      setShowVideoCall(false)
    }
  }, [roomId])

  useEffect(() => {
    Api.post(
      `room/initiate`,
      JSON.stringify({
        userIds: [selectedUser._id],
        type: 'consumer-to-consumer',
      }),
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
          Accept: 'application/json',
          authorization: 'Bearer ' + token,
        },
      }
    ).then((res) => {
      const data = res.data.chatRoom.chatRoomId
      const isNew = res.data.chatRoom.isNew
      setRoomId(data)
      if (!isNew) {
        getConversation(data)
      }
    })
  }, [selectedUser])

  const getConversation = (id) => {
    Api.get(`room/${id}`, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        Accept: 'application/json',
        authorization: 'Bearer ' + token,
      },
    }).then((res) => {
      const data = res.data.conversation || []
      setConversation(data)
    })
  }

  const handleOnChange = (event) => {
    setMessage(event.target.value)
  }

  const handleOnClick = () => {
    if (message !== '') {
      Api.post(
        `room/${roomId}/message`,
        JSON.stringify({ messageText: message }),
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
            Accept: 'application/json',
            authorization: 'Bearer ' + token,
          },
        }
      ).then((res) => {
        setMessage('')
        getConversation(roomId)
      })
    }
  }

  const handleOnCall = () => {
    setShowVideoCall(true)
  }

  const previousMessage = conversation.map((chatMessage) => (
    <div
      className={
        chatMessage.postedByUser._id === currentUser._id
          ? 'text-right'
          : 'text-left'
      }
    >
      <div
        className={
          chatMessage.postedByUser._id === currentUser._id
            ? 'talk-bubble triangle right-top'
            : 'talk-bubble triangle left-top'
        }
      >
        <div className='talktext'>{chatMessage.message.messageText}</div>
      </div>
    </div>
  ))

  return (
    <div style={{ width: '70%' }}>
      <VideoComponent
        socket={socket}
        selectedUser={selectedUser}
        token={token}
        currentUser={currentUser}
        startCall={showVideoCall}
      />
      {!showVideoCall && (
        <React.Fragment>
          <div className='user-name'>
            {selectedUser.firstName + ' ' + selectedUser.lastName}
          </div>
          <div className='prev-message'>{previousMessage}</div>
          <div className='message-area'>
            <input
              className='input-box'
              type='text'
              placeholder='type a message'
              onChange={(event) => {
                handleOnChange(event)
              }}
              value={message}
            ></input>
            <span className='send-icon'>
              <img src={SendIcon} onClick={handleOnClick} />
            </span>
            <span className='send-icon'>
              <img src={VideoCallIcon} onClick={handleOnCall} />
            </span>
          </div>
        </React.Fragment>
      )}
    </div>
  )
}
export default ShowChat

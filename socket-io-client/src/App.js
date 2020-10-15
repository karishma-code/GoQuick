import React, { useState, useEffect } from 'react'
import socketIOClient from 'socket.io-client'
import './styles.css'
import SendIcon from './assets/curve-left-arrow.png'
import VideoComponent from './screens/VideoComponent'
import ShowChat from './Chat'
import Api from './Api'

function App() {
  const [response, setResponse] = useState([])
  const [currentUser, setCurrentUser] = useState({})
  const [userName, setUserName] = useState('')
  const [users, setUsers] = useState([])
  const [token, setToken] = useState('')
  const [selectedUser, setSelectedUser] = useState({})
  const [showChat, setShowChat] = useState(false)
  const [socket, setSocket] = useState(null)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [roomId, setRoomId] = useState('')
  const [newMessage, setNewMessage] = useState(null)
  const [resentConversation, setResentConversation] = useState([])

  useEffect(() => {
    let socketObj = socketIOClient.connect('http://localhost:4001')
    socketObj.on('connect', () => {
      console.log('Connected to Socket')

      setSocket(socketObj)
      socketObj.on('new message', (newMessage) => {
        setNewMessage(newMessage.message)
      })
    })
    Api.get(`users`).then((res) => {
      const persons = res.data.users
      setUsers(persons)
    })
  }, [])

  useEffect(() => {
    if (roomId !== '') {
      socket.emit('subscribe', roomId, selectedUser._id)
      setShowVideoCall(false)
    }
  }, [roomId])

  useEffect(() => {
    if (newMessage) {
      if (
        newMessage.chatRoomId === roomId &&
        newMessage.readByRecipients.length === 1
      )
        markAsRead()
      else getRecentConversation(currentUser, token)
    }
  }, [newMessage])

  const markAsRead = () => {
    Api.put(
      `room/${roomId}/mark-read`,
      JSON.stringify({
        userId: [selectedUser._id],
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
      const data = res.data
      getRecentConversation(currentUser, token)
    })
  }

  const handleOnClick = () => {
    let userData = users.find((user) => user.firstName === userName)
    setCurrentUser(userData)
    if (userData) {
      Api.post(`login/${userData._id}`).then((res) => {
        const authToken = res.data.authorization
        setToken(authToken)
        getRecentConversation(userData, authToken)
        if (socket) {
          socket.emit('identity', userData._id)
        }
      })
    }
  }

  const getRecentConversation = (userData, authToken) => {
    Api.get(`room?userId=${userData._id}`, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        Accept: 'application/json',
        authorization: 'Bearer ' + authToken,
      },
    }).then((res) => {
      const data = res.data.conversation
      setResentConversation(data)
    })
  }

  const handleOnChange = (event) => {
    setUserName(event.target.value)
  }

  const handleStartConversation = (user) => {
    setSelectedUser(user)
    setShowChat(true)
  }

  const handleStartCall = (user) => {
    console.log(user)
    setShowChat(false)
    setShowVideoCall(true)
  }

  const getUsersList = () => {
    return resentConversation.map((data) => (
      <div>
        <div
          className='user'
          onClick={() =>
            handleStartConversation(
              data.roomInfo[1][0]._id === currentUser._id
                ? data.roomInfo[0][0]
                : data.roomInfo[1][0]
            )
          }
        >
          <div style={{ display: 'flex' }}>
            <div style={{ fontWeight: 600, width: '80%' }}>
              {data.roomInfo[1][0]._id === currentUser._id
                ? data.roomInfo[0][0].firstName +
                  ' ' +
                  data.roomInfo[0][0].lastName
                : data.roomInfo[1][0].firstName +
                  ' ' +
                  data.roomInfo[1][0].lastName}
            </div>
            <div
              className={
                data.readByRecipients.length === 1 &&
                data.postedByUser._id !== currentUser._id
                  ? 'status'
                  : ''
              }
            ></div>
          </div>

          <div style={{ fontSize: '12px' }}>{data.message.messageText}</div>
        </div>
      </div>
    ))
  }

  return (
    <div style={{ height: '100%' }}>
      {token ? (
        <div>
          <div style={{ display: 'flex', padding: '20px' }}>
            <div style={{ width: '30%' }}>
              <div className='user-name'>
                {currentUser.firstName + ' ' + currentUser.lastName}{' '}
              </div>
              {getUsersList()}
            </div>
            {showChat && (
              <ShowChat
                setRoomId={(id) => setRoomId(id)}
                roomId={roomId}
                socket={socket}
                selectedUser={selectedUser}
                token={token}
                currentUser={currentUser}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                markAsRead={markAsRead}
              />
            )}
            {showVideoCall && (
              <VideoComponent
                socket={socket}
                selectedUser={selectedUser}
                token={token}
                currentUser={currentUser}
              />
            )}
          </div>
        </div>
      ) : (
        <div style={{ height: '100%' }}>
          <input
            className='input-box'
            type='text'
            placeholder='Enter user Name to Login'
            onChange={(event) => {
              handleOnChange(event)
            }}
            value={userName}
          ></input>
          <span className='send-icon'>
            <img src={SendIcon} onClick={handleOnClick} />
          </span>
        </div>
      )}

      {/* <VideoComponent />
      {previousMessage}
      <div className='message-area'>
        <input
          className='input-box'
          type='text'
          placeholder='type a message'
          onChange={(event) => {
            handleOnChange(event)
          }}
          value={value}
        ></input>
        <span className='send-icon'>
          <img src={SendIcon} onClick={handleOnClick} />
        </span>
      </div> */}
    </div>
  )
}

export default App

import React, { useEffect, useRef, useState } from 'react'
import { IoSendSharp } from 'react-icons/io5'
import './App.css'

import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'
import 'firebase/analytics'

import { useAuthState } from 'react-firebase-hooks/auth'
import { useCollectionData } from 'react-firebase-hooks/firestore'

firebase.initializeApp({
  // config
})

const auth = firebase.auth()
const firestore = firebase.firestore()

function App() {
  const [user] = useAuthState(auth)

  return (
    <div className="App">
      <header>
        <h1>Почти Телеграм</h1>
        <SignOut />
      </header>

      <section>{user ? <ChatRoom /> : <SignIn />}</section>
    </div>
  )
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider()
    auth.signInWithRedirect(provider)
  }

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>
        Войти через Google
      </button>
    </>
  )
}

function SignOut() {
  return (
    auth.currentUser && (
      <button className="sign-out" onClick={() => auth.signOut()}>
        Выйти
      </button>
    )
  )
}

function ChatRoom() {
  const dummy = useRef()
  const messagesRef = firestore.collection('messages')
  const query = messagesRef.orderBy('createdAt', 'asc').limitToLast(25)

  const [messages] = useCollectionData(query, { idField: 'id' })

  const [formValue, setFormValue] = useState('')

  const sendMessage = async (e) => {
    e.preventDefault()

    const { uid, photoURL } = auth.currentUser

    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
    })

    setFormValue('')
  }

  useEffect(() => {
    const $messages = document.querySelectorAll('.message')
    let $checkingMsg = $messages[0]

    const main = document.querySelector('main')
    const scroll = main.scrollHeight || 0
    main.scrollBy(0, scroll)

    $messages.forEach(($msg) => {
      $msg.classList.remove('local-last')
      if ($msg.classList[1] !== $checkingMsg.classList[1]) {
        $checkingMsg.classList.add('local-last')
      }
      $checkingMsg = $msg
    })
    $messages[$messages.length - 1]?.classList.add('local-last')
  }, [messages])

  return (
    <>
      <main>
        {messages && messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}

        <span className="dummy" ref={dummy}></span>
      </main>

      <form onSubmit={sendMessage}>
        <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Написать сообщение..." />

        <button type="submit" disabled={!formValue}>
          <IoSendSharp />
        </button>
      </form>
    </>
  )
}

function ChatMessage(props) {
  const { text, uid, photoURL } = props.message

  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received'

  return (
    <>
      <div className={`message ${messageClass}`}>
        <img src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} alt="avatar" />
        <p>{text}</p>
      </div>
    </>
  )
}

export default App

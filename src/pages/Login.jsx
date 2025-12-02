import React, { useState } from 'react'
import Form from '../utils/Form'
import Input from '../utils/Input'
import Button from '../utils/Button'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { Auth } from '../firebase'
import { useDispatch} from 'react-redux'
import { login } from '../features/authSlice'
import { useNavigate } from 'react-router-dom'
import LinkU from '../utils/LinkU'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const dispatch = useDispatch()
  const navigate = useNavigate()
 

  const handleSubmit = async (e) => {
    e.preventDefault();    
    try {
      setLoading(true)
      const response = await signInWithEmailAndPassword(Auth, email, password)
      dispatch(login({
        uid: response.user.uid,       
        email: email      
      }))

      setLoading(false)
      alert("User Loged in succeffully")
      navigate("/")

    } catch (error) {
      alert(error.message)
      setLoading(false)

    }


  }
  return (
    <div className="form-wrapper w-full flex h-[100vh] justify-center items-center align-middle">
      <Form onSubmit={handleSubmit} >

        <Input value={email} type='email' required onChange={(e) => setEmail(e.target.value)} placeholder={"Email"} />
        <Input value={password} type='password' required onChange={(e) => setPassword(e.target.value)} placeholder={"password"} />
        <Button type='submit' text={`${loading ? "Loging..." : "Login"}`} />
        <div className="extra">
          <p>
            Have not an account? <LinkU text="Register" url="/register" />
          </p>
        </div>

      </Form>

    </div>
  )
}

export default Login


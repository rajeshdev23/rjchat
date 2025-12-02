import React, { useState } from 'react'
import Form from '../utils/Form'
import Input from '../utils/Input'
import Button from '../utils/Button'
import { FaImage } from "react-icons/fa";
import LinkU from '../utils/LinkU';
import { Auth, storage, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, collection } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { login } from '../features/authSlice';
import { useDispatch, useSelector } from 'react-redux';

const Register = () => {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user);
  console.log(user)


  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true)

    const nameValue = e.target[0].value;
    const emailValue = e.target[1].value;
    const passwordValue = e.target[2].value;

    try {
      const response = await createUserWithEmailAndPassword(Auth, emailValue, passwordValue);
      let avatarURL = "";
      if (file) {
        const storageRef = ref(storage, `avatars/${response.user.uid}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        avatarURL = await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            null,
            reject,
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });
      }
      await setDoc(
        doc(collection(db, "users"), response.user.uid),
        {
          uid: response.user.uid,
          name: nameValue,
          email: emailValue,
          avatar: avatarURL,
          createdAt: new Date(),
        }
      );
      await setDoc(
        doc(collection(db, "userChats"), response.user.uid),
        {}
      )
      dispatch(login({
        uid: response.user.uid,
        email: emailValue,
        name: nameValue,
        avater: avatarURL
      }))
      setLoading(false)

      alert("User created successfully!");
      navigate("/")
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <>
      <div className="form-wrapper w-full flex h-[100vh] justify-center items-center align-middle">
        <Form onSubmit={handleSubmit}>
          <Input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
          />
          <Input type='email' placeholder="Email" />
          <Input type='password' placeholder="Password" />

          <Input
            type='file'
            className='hidden'
            id="file"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <div className="lable-box">
            <label htmlFor="file">
              <span><FaImage /></span> Add Avatar
            </label>
          </div>
          <Button text={loading ? "Registring..." : "Register"} type="submit" />
          <div className="extra">
            <p>
              Already have an account? <LinkU text="Login" url="/login" />
            </p>
          </div>

        </Form>
      </div>
    </>
  );
};

export default Register;

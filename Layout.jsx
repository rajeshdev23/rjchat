import React, { use, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { finishingLoading, login, logout, setUserProfile } from './src/features/authSlice';
import { onAuthStateChanged } from 'firebase/auth';
import { Auth, db } from './src/firebase';
import { getDoc, doc } from 'firebase/firestore';

const Layout = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(Auth, async (user) => {
      if (user) {

        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref)
        dispatch(
          login({
            uid: user.uid,
            email: user.email,
          })
        );       
        if (snap.exists()) {
          const data = snap.data();
          dispatch(setUserProfile({
            ...data,
            createdAt: data.createdAt?.toMillis() 
          }));

        }

      } else {
        dispatch(logout());
      }
      dispatch(finishingLoading())
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <Outlet />
    </>
  );
};

export default Layout;

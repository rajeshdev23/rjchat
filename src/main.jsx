import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import Layout from '../Layout.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import { Provider } from 'react-redux'
import { store } from './app/store.js'
import PrivateRoute from './privateroute/PrivateRoute.jsx'
import RedirectIfLogedIn from './privateroute/RedirectIfLogedIn.jsx'
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route index element={
        <PrivateRoute>
          <Home />
        </PrivateRoute>
      } />

      <Route path="/about" element={<About />} />

      <Route path="/register" element={
        <RedirectIfLogedIn>
          <Register />
        </RedirectIfLogedIn>
      } />

      <Route path="/login" element={
        <RedirectIfLogedIn>
          <Login />
        </RedirectIfLogedIn>
      } />
    </Route>
  )
);


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store} >
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>
)

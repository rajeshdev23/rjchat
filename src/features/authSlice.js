import { createSlice } from "@reduxjs/toolkit"

const initialState={
    user: null,
    loading: true,
    profile: null
}


const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers:{
        login:(state,action)=>{
            state.user = action.payload
        },
        logout:(state)=>{
          state.user = null         
          state.profile = null          
        },
        setUserProfile:(state,action)=>{
            state.profile = action.payload          

        },
        finishingLoading:(state)=>{
            state.loading = false

        }

    }
})

export const {login, logout , setUserProfile, finishingLoading} = authSlice.actions
export default authSlice.reducer
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  chatId: "null",
  user: {},
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    changeUser: (state, action) => {
      state.user = action.payload.user;
      state.chatId = action.payload.chatId;
    },
    resetChat: (state) => {
        state.chatId = "null";
        state.user = {};
    }
  },
});

export const { changeUser, resetChat } = chatSlice.actions;
export default chatSlice.reducer;

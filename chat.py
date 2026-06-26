import chainlit as cl
import openai

@cl.on_chat_start
async def start():
    await cl.Message(content="Hệ thống Chatbot nội bộ đã sẵn sàng!").send()

@cl.on_message
async def main(message: cl.Message):
    await cl.Message(content=f"Bot nhận được câu hỏi: {message.content}").send()
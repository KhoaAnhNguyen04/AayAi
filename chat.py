import chainlit as cl
from openai import AsyncOpenAI

@cl.on_chat_start
async def start():
    # Gửi tin nhắn chào mừng khi người dùng mở khung chat
    welcome_message = """👋 Xin chào! Hệ thống Chatbot nội bộ đã sẵn sàng. Bạn cần tôi giúp gì nào? 
⚙️ *[Quay lại màn hình Quản lý Data Sources](/config)*"""
    await cl.Message(content=welcome_message).send()

@cl.on_message
async def main(message: cl.Message):
    # Trích xuất cấu hình từ file main.py đang chạy
    from main import system_config
    
    api_key = system_config.get("api_key")
    system_prompt = system_config.get("prompt", "Bạn là trợ lý nội bộ chuyên nghiệp.")

    # 1. Kiểm tra xem người dùng đã nhập API Key bên giao diện System UI chưa
    if not api_key:
        await cl.Message(content="⚠️ **Lỗi:** Chưa có API Key! Vui lòng quay lại trang Cấu hình để nhập OpenAI API Key trước khi sử dụng bot.").send()
        return

    # Khởi tạo client OpenAI với API key lấy từ cấu hình
    client = AsyncOpenAI(api_key=api_key)

    # Khởi tạo một tin nhắn rỗng để chuẩn bị hứng dữ liệu trả về (cho hiệu ứng typing)
    msg = cl.Message(content="")
    await msg.send()

    try:
        # 2. Gọi API tới OpenAI (Sử dụng model gpt-3.5-turbo để tiết kiệm chi phí cho demo)
        stream = await client.chat.completions.create(
            model="gpt-3.5-turbo", 
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message.content}
            ],
            stream=True, # Bật tính năng stream
        )

        # 3. Đọc dữ liệu trả về và stream trực tiếp lên giao diện
        async for part in stream:
            if token := part.choices[0].delta.content or "":
                await msg.stream_token(token)

        # Hoàn tất việc stream
        await msg.update()
        
    except Exception as e:
        # Xử lý nếu API Key sai hoặc hết tiền
        await cl.Message(content=f"❌ **Đã có lỗi xảy ra từ OpenAI:** {str(e)}").send()
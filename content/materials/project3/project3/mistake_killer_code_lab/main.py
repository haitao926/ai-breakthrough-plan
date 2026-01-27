# 🐍 后端开发任务 (难度: ⭐⭐⭐)

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

class Mistake(BaseModel):
    subject: str
    desc: str

# 数据库 (暂时用列表代替)
db = []

@app.post("/api/mistakes")
def save_mistake(data: Mistake):
    print(f"收到数据: {data}")

    # --- 👇 你的代码写在下面 👇 ---
    
    # 任务 A: 逻辑判断
    # 目前没有任何校验，空数据也能保存。
    # 请添加一个 if 判断，如果 subject 为空，返回错误信息。
    
    # 任务 B: 数据存储
    # 目前我们只是打印了数据，没有真正存进去。
    # 请取消下面这行代码的注释，让数据真正入库。
    # db.append(data)
    
    # --- 👆 你的代码写在上面 👆 ---

    return {"status": "success", "msg": "已接收(但在 main.py 任务B完成前不会保存)"}

@app.get("/api/mistakes")
def get_mistakes():
    return db

if __name__ == "__main__":
    print("🚀 服务器启动！访问 http://127.0.0.1:8000/static/index.html")
    uvicorn.run(app, host="127.0.0.1", port=8000)

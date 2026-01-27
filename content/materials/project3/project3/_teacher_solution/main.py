# [参考答案] 后端完美代码

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

class Mistake(BaseModel):
    subject: str
    desc: str

db = []

@app.post("/api/mistakes")
def save_mistake(data: Mistake):
    print(f"收到数据: {data}")

    # 任务 A: 逻辑判断
    if len(data.subject) == 0:
        return {"status": "error", "msg": "科目不能为空！"}
    
    # 任务 B: 数据存储
    db.append(data)
    
    # 任务 C: 返回结果
    return {"status": "success", "msg": "已保存到云端"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

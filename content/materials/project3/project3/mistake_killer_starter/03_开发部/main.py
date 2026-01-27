# 🐍 后端控制中心 (main.py)

# 1. 导入工具包
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn

# 2. 创建 APP 实例
app = FastAPI()

# 3. 挂载静态文件 (让浏览器能访问 static 文件夹里的 html)
app.mount("/static", StaticFiles(directory="static"), name="static")

# 定义数据的格式 (就像填表一样，必须按这个格式来)
class MistakeModel(BaseModel):
    subject: str
    description: str

# 模拟一个数据库 (用列表代替)
fake_database = []

# --- 👇 你的代码写在下面 👇 ---

# TODO 1: 创建一个根路由
# 当用户访问 http://127.0.0.1:8000/ 时，返回一句话
@app.get("/")
def read_root():
    return {"message": "________"}  # 填空：Hello World!

# TODO 2: 创建一个“获取所有错题”的接口
# 请求方式：GET
# 路径：/api/mistakes
@app.get("/api/mistakes")
def get_all_mistakes():
    return fake_database

# TODO 3: 创建一个“保存错题”的接口
# 请求方式：POST
# 路径：/api/mistakes
@app.post("/api/mistakes")
def create_mistake(mistake: MistakeModel):
    # 1. 把前端发来的数据 (mistake) 存入数据库 (fake_database)
    # 提示：使用 .append() 方法
    # fake_database.________(mistake)
    fake_database.append(mistake)
    
    # 2. 返回一个成功信号
    return {"status": "success", "msg": "已保存"}

# --- 👆 你的代码写在上面 👆 ---

if __name__ == "__main__":
    print("🚀 服务器启动中... 请在浏览器打开 http://127.0.0.1:8000/static/index.html")
    uvicorn.run(app, host="127.0.0.1", port=8000)

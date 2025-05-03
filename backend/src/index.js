import express from 'express' 
import dotenv from 'dotenv'

dotenv.config(); 

const app = express();

const port= process.env.PORT || 8080;

app.get('/',(req,resp)=>{
    resp.send('Hello')
})

app.listen(port,()=>{
console.log(`server is running on the ${port}`);
})
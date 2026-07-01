const IS_PROD = import.meta.env.PROD;;
const server = IS_PROD ?
    "https://video-call-rmjo.onrender.com" //production url
    :
    "http://localhost:8000"//development url

export default server;
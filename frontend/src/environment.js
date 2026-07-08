const IS_PROD = import.meta.env.PROD;;
const server = IS_PROD ?
    "" //production url--> backend on render
    :
    "http://localhost:8000"//development url

export default server;
import Cors from 'cors';
import initMiddleware from './init-middleware';

const cors = initMiddleware(
  Cors({
    origin: 'https://temp-mail-olive-ten.vercel.app',
    methods: ['GET', 'POST', 'OPTIONS'],
  })
);

export default cors;

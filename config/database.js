import { connect as _connect } from 'mongoose';
import config from './config';

class Connection {
    constructor() {
        const url = config.MONGO_URL;

        this.connect(url).then( () => {
            console.log('✔ Database Connected');
        }).catch((e) => {
            console.error('✘ MONGODB ERROR: ', e.message);
        });
    }

    async connect(url) {
        try {
            await _connect(url);
        }
		catch (e) {
            throw e;
        }
    }
}

export default new Connection();
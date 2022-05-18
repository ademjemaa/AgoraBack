import path from 'path';

export default () => {
    const config = {
        'MODE': 'Development',
        'PORT': process.env.PORT || 5000,
        'MONGO_URL': process.env.MONGO_URL,
	};

    if ( process.env.NODE_ENV === 'production' ) {
        config.MODE = 'Production';
    }

    return config;
};
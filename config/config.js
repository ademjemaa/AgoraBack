import path from 'path';

export default () => {
    const config = {
        'MODE': 'Development',
        'PORT': process.env.PORT || 5000,
        'DBURL': process.env.DBURL,
	};

    if ( process.env.NODE_ENV === 'production' ) {
        config.MODE = 'Production';
    }

    return config;
};

const jwt = require('jsonwebtoken');


const generarJWT = (id) => {

    return new Promise( (resolve, reject)=> {

        const payload = {
            id
        };
        
        jwt.sign(payload, 'codigo-token-fake',
            {expiresIn: '9h'},
            (err, token) => {
    
            if(err) {
                console.log(err);
                reject('No se pudo generar el JWT');
            } else {
                resolve(token);
            }
            });
    });
}




module.exports = { generarJWT,  }
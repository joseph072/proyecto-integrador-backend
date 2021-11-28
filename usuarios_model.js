const conexion = require("./conexion")
const bcryptjs = require('bcryptjs');


module.exports =  {
  insertar(nombre, direccion, documento, telefono, usuario, clave, rol) {
    return new Promise( async (resolve, reject) => {

        let passwordHash = await bcryptjs.hash(clave, 8);

      conexion.query(`insert into usuarios
            (nombre, direccion, documento, telefono, usuario, clave, rol)
            values
            (?, ?, ?, ?, ?, ?, ?)`,
        [nombre, direccion, documento, telefono, usuario, passwordHash, rol], (err, resultados) => {
          if (err) reject(err);
          else resolve(resultados.insertId);
        });
    });
  },

  authentication(usuario, clave){
    return new Promise( async (resolve, reject) => {

    // let passwordHash = await bcryptjs.hash(clave, 8);


    if(usuario && clave){
        conexion.query(`select * from usuarios where usuario='${usuario}' and clave='${clave}'`,
        [usuario, clave], (err, resultados) => {
        if (err) reject(err);
        else resolve(resultados.insertId);
        })
    }



    //   conexion.query(`insert into usuarios
    //         (nombre, direccion, documento, telefono, usuario, clave, rol)
    //         values
    //         (?, ?, ?, ?, ?, ?, ?)`,
    //     [nombre, direccion, documento, telefono, usuario, passwordHash, rol], (err, resultados) => {
    //       if (err) reject(err);
    //       else resolve(resultados.insertId);
    //     });


    });
  }
}




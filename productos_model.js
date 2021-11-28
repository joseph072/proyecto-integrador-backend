const conexion = require("./conexion")
const fs = require("fs");
const path = require("path");
module.exports = {
  insertar(vendedor, nombre, descripcion, precio) {
    return new Promise((resolve, reject) => {
      conexion.query(`insert into productos
            (vendedor, nombre, descripcion, precio)
            values
            (?, ?, ?, ?)`,
        [vendedor, nombre, descripcion, precio], (err, resultados) => {
          if (err) reject(err);
          else resolve(resultados.insertId);
        });
    });
  },
  agregarFoto(idProducto, nombreFoto) {
    return new Promise((resolve, reject) => {
      conexion.query(`insert into fotos_productos
            (id_producto, foto)
            values
            (?, ?)`,
        [idProducto, nombreFoto], (err, resultados) => {
          if (err) reject(err);
          else resolve(resultados.insertId);
        });
    });
  },
  obtener() {
    return new Promise((resolve, reject) => {
      conexion.query(`select id, vendedor ,nombre, descripcion, precio from productos`,
        (err, resultados) => {
          if (err) reject(err);
          else resolve(resultados);
        });
    });
  },
  obtenerConFotos() {
    return new Promise((resolve, reject) => {
      conexion.query(`select * from productos`,
        async (err, resultados) => {
          if (err) reject(err);
          else {
            for (let x = 0; x < resultados.length; x++) {
              resultados[x].foto = await this.obtenerPrimeraFoto(resultados[x].id);
            }
            resolve(resultados);
          }
        });
    });
  },
  obtenerPrimeraFoto(idProducto) {
    return new Promise((resolve, reject) => {
      conexion.query(`select foto from fotos_productos WHERE id_producto = ? limit 1`,
        [idProducto],
        (err, resultados) => {
          if (err) reject(err);
          else resolve(resultados[0].foto);
        });
    });
  },
  obtenerFotos(idProducto) {
    return new Promise((resolve, reject) => {
      conexion.query(`select id_producto, foto FROM fotos_productos WHERE id_producto = ?`,
        [idProducto],
        (err, resultados) => {
          if (err) reject(err);
          else resolve(resultados);
        });
    });
  },
  obtenerPorId(id) {
    return new Promise((resolve, reject) => {
      conexion.query(`select id, nombre,descripcion, precio from productos where id = ?`,
        [id],
        (err, resultados) => {
          if (err) reject(err);
          else resolve(resultados[0]);
        });
    });
  },
  actualizar(id, nombre, precio) {
    return new Promise((resolve, reject) => {
      conexion.query(`update productos
            set nombre = ?,
            precio = ?
            where id = ?`,
        [nombre, precio, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        });
    });
  },
  eliminar(id) {
    return new Promise(async (resolve, reject) => {
      const fotos = await this.obtenerFotos(id);
      for (let m = 0; m < fotos.length; m++) {
        await fs.unlinkSync(path.join(__dirname, "fotos_productos", fotos[m].foto));
      }
      conexion.query(`delete from productos
            where id = ?`,
        [id],
        (err) => {
          if (err) reject(err);
          else resolve();
        });
    });
  },
}

// Cargar valores del entorno
require("dotenv").config();
const express = require("express");
const bcryptjs = require('bcryptjs');

const conexion = require("./conexion")

const  cors = require("cors");

const { generarJWT } = require ('./jwt'); 


  path = require("path"),
  app = express(),
  productoModel = require("./productos_model"),
  usuariosModel = require("./usuarios_model"),
  clienteModel = require("./clientes_model"),
  ventaModel = require("./ventas_model"),
  productoVendidoModel = require("./producto_vendido_model"),
  formidable = require("formidable"),
  session = require("express-session"),
  fs = require("fs");
const {v4: uuidv4} = require("uuid");
// const session = require("express-session");


const indiceDeProducto = (carrito, idProducto) => {
  return carrito.findIndex(productoDentroDelCarrito => productoDentroDelCarrito.id === idProducto);
}
const existeProducto = (carrito, producto) => {
  return indiceDeProducto(carrito, producto.id) !== -1;
}


const DOMINIO_PERMITIDO_CORS = "http://localhost:4200",
  DIRECTORIO_FOTOS = path.join(__dirname, "fotos_productos"),
  DIRECTORIO_DIST = path.join(__dirname, "dist"),
  PUERTO = 3000;

  app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.use(cors({origin:true, credentials:true}));
  
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}))

app.use(session({
  secret: process.env.SESSION_KEY,
  saveUninitialized: true,
  resave: true,
}))
// Fotos
app.use("/foto_producto", express.static(DIRECTORIO_FOTOS));
// Estático
app.use("/", express.static(DIRECTORIO_DIST));

if (!fs.existsSync(DIRECTORIO_FOTOS)) {
  fs.mkdirSync(DIRECTORIO_FOTOS);
}
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Credentials", "true");
  res.set("Access-Control-Allow-Origin", DOMINIO_PERMITIDO_CORS);
  res.set("Access-Control-Allow-Headers", "Content-Type", "text/plain");
  res.set("Access-Control-Allow-Methods", "DELETE", 'POST');
  next();
});
app.delete("/producto", async (req, res) => {

  if (!req.query.id) {
    res.end("Not found");
    return;
  }
  const idProducto = req.query.id;
  await productoModel.eliminar(idProducto);
  res.json(true);
});
//Todo: separar rutas
/*
Compras
 */
app.get("/detalle_venta", async (req, res) => {
  if (!req.query.id) {
    res.end("Not found");
    return;
  }
  const idVenta = req.query.id;
  const venta = await ventaModel.obtenerPorId(idVenta);
  venta.productos = await ventaModel.obtenerProductosVendidos(idVenta);
  res.json(venta);
})

app.get("/detalle_cliente", async (req, res) => {
  if (!req.query.nombre) {
    res.end("Not found");
    return;
  }
  const idVenta = req.query.nombre;
  const venta = await ventaModel.obtenerPorCliente(idVenta);
  // venta.productos = await ventaModel.obtenerProductosVendidos(idVenta);
  res.json(venta);
})



app.get("/ventas", async (req, res) => {
  const ventas = await ventaModel.obtener();
  res.json(ventas);
});
app.post("/compra", async (req, res) => {
  const {nombre, direccion} = req.body;
  let total = 0;

  const carrito = req.session.carrito || [];
  carrito.forEach(p => total += p.precio);
  const idCliente = await clienteModel.insertar(nombre, direccion);
  const idVenta = await ventaModel.insertar(idCliente, total);
  // usamos for en lugar de foreach por el await
  for (let m = 0; m < carrito.length; m++) {
    const productoActual = carrito[m];
    await productoVendidoModel.insertar(idVenta, productoActual.id);
  }
  // Limpiar carrito...
  req.session.carrito = [];
  // ¡listo!
  res.json(true);
});
app.get("/carrito", (req, res) => {
  res.json(req.session.carrito || []);
})
// No está en un DELETE porque no permite datos en el body ._.
app.post("/carrito/eliminar", async (req, res) => {
  const idProducto = req.body.id;
  const indice = indiceDeProducto(req.session.carrito, idProducto);
  if (indice >= 0 && req.session.carrito) {
    req.session.carrito.splice(indice, 1);
  }
  res.json(true);
});
app.post("/carrito/existe", async (req, res) => {
  const idProducto = req.body.id;
  const producto = await productoModel.obtenerPorId(idProducto);
  const existe = existeProducto(req.session.carrito || [], producto);
  res.json(existe);
});

app.post("/carrito/agregar", async (req, res) => {
  const idProducto = req.body.id;
  const producto = await productoModel.obtenerPorId(idProducto);
  if (!req.session.carrito) {
    req.session.carrito = [];
  }
  // por el momento no se pueden llevar más de dos productos iguales
  if (existeProducto(req.session.carrito, producto)) {
    res.json(true);
    return;
  }
  req.session.carrito.push(producto);
  res.json(req.body);
});


app.post('/fotos_producto', (req, res) => {
  const form = formidable({
    multiples: true,
    uploadDir: DIRECTORIO_FOTOS,
  });

  form.parse(req, async (err, fields, files) => {
    const idProducto = fields.idProducto;
    for (let clave in files) {
      const file = files[clave];
      const nombreArchivo = file.name;
      await productoModel.agregarFoto(idProducto, nombreArchivo)
    }
  });

  form.on("fileBegin", (name, file) => {
    const extension = path.extname(file.name);
    const nuevoNombre = uuidv4().concat(extension);
    file.path = path.join(DIRECTORIO_FOTOS, nuevoNombre);
    file.name = nuevoNombre;
  })

  form.on("end", () => {
    res.json({
      respuesta: true,
    })
  })

});

app.post('/producto', async (req, res) => {
  const producto = req.body;
  const respuesta = await productoModel.insertar(producto.vendedor, producto.nombre, producto.descripcion, producto.precio);
  res.json(respuesta);
});

app.get('/productos', async (req, res) => {
  const productos = await productoModel.obtener();
  res.json(productos);
});
app.get('/productos_con_fotos', async (req, res) => {
  const productos = await productoModel.obtenerConFotos();
  res.json(productos);
});

app.get('/producto', async (req, res) => {
  if (!req.query.id) {
    res.end("not found");
    return;
  }
  const producto = await productoModel.obtenerPorId(req.query.id);
  producto.fotos = await productoModel.obtenerFotos(req.query.id);
  res.json(producto);
});



app.post('/usuario', async (req, res) => {
  const usuario = req.body;
  const respuesta = await usuariosModel.insertar(usuario.nombre, usuario.direccion, usuario.documento, usuario.telefono, usuario.usuario, usuario.clave, usuario.rol);
  res.json(respuesta);
});


app.post('/login', async (req, res) => {
  const usuario = req.body.usuario;
  const clave = req.body.clave;
  let passwordHash = await bcryptjs.hash(clave, 8);
  if(usuario && clave){
    conexion.query('select * from usuarios where usuario= ?', [usuario]  , async (error, results) => {
      if(results.length == 0 || !(await bcryptjs.compare(clave, results[0].clave))){
        res.json({
          msg: 'USUARIO Y/O PASSWORD INCORRECTOS',
          ok: false
        });
      } else {
        const token = await generarJWT(results);
        res.json({
          msg: 'USUARIO CORRECTO',
          data: results,
          token,
          ok: true
        });

      }
    })
  } else {
    console.log('xxxx');
  }
});



app.listen(PUERTO, err => {
  if (err) {
    // Aquí manejar el error
    console.error("Error escuchando: ", err);
    return;
  }
  console.log(`Escuchando en el puerto :${PUERTO}`);
});

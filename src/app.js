import express from 'express';

import dashboardRoutes from './routes/dashboard.routes.js';
import clientesRoutes from './routes/clientes.routes.js';
import planesRoutes from './routes/planes.routes.js';
import suscripcionesRoutes from './routes/suscripciones.routes.js';
import pagosRoutes from './routes/pagos.routes.js';


const app = express();


/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://penuelasport.netlify.app'
];


app.use((req, res, next) => {
    const origin =
        req.headers.origin;

    if (
        !origin ||
        allowedOrigins.includes(
            origin
        )
    ) {
        res.header(
            'Access-Control-Allow-Origin',
            origin || '*'
        );
    }

    res.header(
        'Vary',
        'Origin'
    );

    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );

    res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );

    if (
        req.method === 'OPTIONS'
    ) {
        return res.sendStatus(
            204
        );
    }

    next();
});


/*
|--------------------------------------------------------------------------
| Middlewares
|--------------------------------------------------------------------------
*/

app.use(
    express.json()
);


/*
|--------------------------------------------------------------------------
| Rutas
|--------------------------------------------------------------------------
*/

app.get(
    '/api/health',
    (_req, res) => {
        res.json({
            ok: true,
            message: 'API Gym Peñuelas funcionando'
        });
    }
);


app.use(
    '/api/dashboard',
    dashboardRoutes
);

app.use(
    '/api/clientes',
    clientesRoutes
);

app.use(
    '/api/planes',
    planesRoutes
);

app.use(
    '/api/suscripciones',
    suscripcionesRoutes
);

app.use(
    '/api/pagos',
    pagosRoutes
);


/*
|--------------------------------------------------------------------------
| Ruta no encontrada
|--------------------------------------------------------------------------
*/

app.use(
    (_req, res) => {
        res.status(
            404
        ).json({
            error: 'Ruta no encontrada.'
        });
    }
);


/*
|--------------------------------------------------------------------------
| Manejador global de errores
|--------------------------------------------------------------------------
|
| Cualquier error lanzado desde:
|
| routes
| controllers
| services
|
| llegará hasta aquí.
|
| El frontend recibirá siempre:
|
| {
|     "error": "Mensaje..."
| }
|
|--------------------------------------------------------------------------
*/

app.use(
    (
        error,
        _req,
        res,
        _next
    ) => {

        console.error(
            'Error:',
            error
        );


        /*
        |--------------------------------------------------------------------------
        | Código HTTP
        |--------------------------------------------------------------------------
        |
        | Si en algún momento un error define:
        |
        | error.statusCode = 400
        |
        | respetaremos ese código.
        |
        | Por ahora los errores normales seguirán siendo 500,
        | pero el mensaje sí llegará correctamente al frontend.
        |
        */

        const statusCode =
            Number(
                error.statusCode ||
                error.status ||
                500
            );


        /*
        |--------------------------------------------------------------------------
        | Mensaje
        |--------------------------------------------------------------------------
        */

        const message =
            error.message ||
            'Error interno del servidor.';


        res.status(
            statusCode
        ).json({
            error: message
        });
    }
);


export default app;
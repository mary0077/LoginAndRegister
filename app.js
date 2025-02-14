/* comandos npm
npm init
npm install -g nodemon
npm install --save express
npm install express-session
npm install --save body-parser
npm install --save mysql
npm install ejs --save
*/

// Requerendo as dependências
const express = require('express');
const session = require("express-session");
const path = require('path');
const app = express();
const bodyParser = require("body-parser");
const mysql = require("mysql"); 

// Criando a sessão
app.use(session({ secret: "ssshhhhh", resave: true, saveUninitialized: true }));

// Definindo pasta pública para acesso
app.use(express.static('public'));

// Configurando o motor de visualização
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/public'));

// Configurando o bodyparser para leitura de dados do formulário
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Conexão com o banco de dados MySQL
function conectiondb() {
    var con = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '123456',
        database: 'dblogin'
    });

    // Verifica a conexão com o banco
    con.connect((err) => {
        if (err) {
            console.log('Erro ao conectar no banco de dados...', err);
            return;
        }
        console.log('Conexão estabelecida com sucesso!');
    });

    return con;
}

// Rota principal
app.get('/', (req, res) => {
    var message = ' ';
    req.session.destroy();
    res.render('views/registro', { message: message });
});

// Rota para registro
app.get('/views/registro', (req, res) => {
    res.redirect('../');
});

// Rota para home
app.get("/views/home", function (req, res) {
    // Verifica se existe sessão ativa
    if (req.session.user) {
        var con = conectiondb();
        var query2 = 'SELECT * FROM users WHERE email LIKE ?';
        con.query(query2, [req.session.user], function (err, results) {
            if (err) {
                console.error(err);
                return res.status(500).send('Database query failed');
            }
            res.render('views/home', { message: results });
        });
    } else {
        res.redirect("/");
    }
});

// Rota para login
app.get("/views/login", function (req, res) {
    var message = ' ';
    res.render('views/login', { message: message });
});

// Método POST para o registro
app.post('/register', function (req, res) {
    var username = req.body.nome;
    var pass = req.body.pwd;
    var email = req.body.email;
    var idade = req.body.idade;

    var con = conectiondb();
    var queryConsulta = 'SELECT * FROM users WHERE email LIKE ?';

    con.query(queryConsulta, [email], function (err, results) {
        if (err) {
            console.error(err); // Loga o erro para ajudar na depuração
            res.status(500).send('Database query failed');
            return;
        }

        if (results && results.length > 0) {
            var message = 'E-mail já cadastrado';
            res.render('views/registro', { message: message });
        } else {
            var query = 'INSERT INTO users (username, email, idade, password) VALUES (?, ?, ?, ?)';

            con.query(query, [username, email, idade, pass], function (err, results) {
                if (err) {
                    console.error(err); // Loga o erro para ajudar na depuração
                    res.status(500).send('Database query failed');
                    return;
                } else {
                    console.log("Usuário adicionado com email " + email);
                    var message = "Usuário registrado com sucesso!";
                    res.render('views/registro', { message: message });
                }
            });
        }
    });
});

// Método POST para o login
app.post('/log', function (req, res) {
    var email = req.body.email;
    var pass = req.body.pass;

    var con = conectiondb();
    var query = 'SELECT * FROM users WHERE password = ? AND email LIKE ?';

    con.query(query, [pass, email], function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).send('Database query failed');
        }

        if (results && results.length > 0) {
            req.session.user = email; // Sessão de identificação            
            console.log("Login feito com sucesso!");
            res.render('views/home', { message: results });
        } else {
            var message = 'Login incorreto!';
            res.render('views/login', { message: message });
        }
    });
});

// Método POST para update de dados
app.post('/update', function (req, res) {
    var email = req.body.email;
    var pass = req.body.pwd;
    var username = req.body.nome;
    var idade = req.body.idade;

    var con = conectiondb();
    var query = 'UPDATE users SET username = ?, password = ?, idade = ? WHERE email LIKE ?';

    con.query(query, [username, pass, idade, req.session.user], function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).send('Database query failed');
        }

        var query2 = 'SELECT * FROM users WHERE email LIKE ?';
        con.query(query2, [req.session.user], function (err, results) {
            if (err) {
                console.error(err);
                return res.status(500).send('Database query failed');
            }
            res.render('views/home', { message: results });
        });
    });
});

// Método POST para deletar usuário
app.post('/delete', function (req, res) {
    var con = conectiondb();
    var query = 'DELETE FROM users WHERE email LIKE ?';

    con.query(query, [req.session.user], function (err, results) {
        if (err) {
            console.error(err);
            return res.status(500).send('Database query failed');
        }
        res.redirect('/');
    });
});

// Inicia o servidor
app.listen(8081, () => console.log('App ouvindo na porta 8081'));

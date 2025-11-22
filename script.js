// ==========================================================
// 🎯 Zona de Configuración - ¡Puedes modificar esto!
// ==========================================================

// Objeto para almacenar todas las cuentas de usuario.
// Puedes añadir o modificar más usuarios aquí.
const userAccounts = {
    // La clave es el nombre de usuario, el valor es un objeto con la contraseña y el saldo.
    "Usuario1": { 
        password: "Contraseña1",
        balance: 1500.50
    },
    // Ejemplo de un segundo usuario que puedes añadir:
    "Usuario2": { 
        password: "password2024",
        balance: 45000.75
    },
    // Añade más usuarios siguiendo el mismo formato:
    /*
    "OtroUsuario": { 
        password: "OtraContraseña",
        balance: 99.99
    }
    */
};

// ==========================================================
// 💻 Lógica Principal de la Aplicación
// ==========================================================

// Referencias a los elementos del DOM
const loginContainer = document.getElementById('login-container');
const bankContainer = document.getElementById('bank-container');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const errorMessage = document.getElementById('error-message');
const displayUsername = document.getElementById('display-username');
const accountBalance = document.getElementById('account-balance');

// Variable para almacenar el usuario actualmente logueado
let loggedInUser = null;

// Función para mostrar la pantalla de error
function showLoginFailed() {
    // 1. Ocultar la pantalla de login y banco
    loginContainer.classList.add('hidden');
    bankContainer.classList.add('hidden');
    
    // 2. Mostrar el mensaje de error
    errorMessage.classList.remove('hidden');

    // 3. Ocultar el error después de 2 segundos y volver a la pantalla de login
    setTimeout(() => {
        errorMessage.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    }, 2000);
}

// Función para mostrar la pantalla del banco
function showBankScreen(username) {
    // Obtener los datos del usuario logueado
    const userData = userAccounts[username];
    
    // 1. Ocultar la pantalla de login
    loginContainer.classList.add('hidden');
    
    // 2. Mostrar la pantalla del banco
    bankContainer.classList.remove('hidden');

    // 3. Actualizar la información del usuario en la pantalla
    displayUsername.textContent = `Bienvenido, ${username}`;
    
    // Formatear el saldo como dinero (ej: 1,500.50 € o $)
    const formattedBalance = userData.balance.toLocaleString('es-ES', { 
        style: 'currency', 
        currency: 'EUR' // Puedes cambiar 'EUR' a 'USD' o el que desees
    });
    accountBalance.textContent = formattedBalance;
}

// Función para manejar el intento de inicio de sesión
function handleLogin(event) {
    // Previene que el formulario se envíe de forma tradicional y recargue la página
    event.preventDefault(); 

    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    // Verificar si el usuario existe en nuestro objeto de cuentas
    if (userAccounts[usernameInput]) {
        // Verificar si la contraseña coincide
        if (userAccounts[usernameInput].password === passwordInput) {
            // Éxito en el login
            loggedInUser = usernameInput;
            showBankScreen(loggedInUser);
        } else {
            // Contraseña incorrecta
            showLoginFailed();
        }
    } else {
        // Usuario no encontrado
        showLoginFailed();
    }

    // Limpiar los campos del formulario
    loginForm.reset();
}

// Función para manejar el cierre de sesión (Logout)
function handleLogout() {
    // 1. Ocultar la pantalla del banco
    bankContainer.classList.add('hidden');
    
    // 2. Mostrar la pantalla de login
    loginContainer.classList.remove('hidden');
    
    // 3. Reiniciar la variable de usuario logueado
    loggedInUser = null;
}

// Añadir los "escuchadores" de eventos
loginForm.addEventListener('submit', handleLogin);
logoutButton.addEventListener('click', handleLogout);

// ==========================================================
// 🎯 Zona de Configuración - ¡Puedes modificar esto!
// ==========================================================

// Objeto para almacenar todas las cuentas de usuario.
// Puedes añadir o modificar más usuarios aquí.
// ==========================================================
// 🎯 Zona de Configuración - ¡Modifica aquí los Usuarios!
// ==========================================================

const userAccounts = {
    // Usuario Normal (puede enviar)
    "Usuario1": { 
        password: "Contraseña1",
        balance: 1500.50,
        group: "Normal",     // Clasificación por grupo
        canSend: true        // Permite enviar dinero
    },
    // Usuario Premium (puede enviar)
    "Usuario2": { 
        password: "password2024",
        balance: 45000.75,
        group: "Premium",
        canSend: true
    },
    // Cuenta del Sistema/Reservas (NO puede enviar dinero)
    "Reserva": { 
        password: "none", // Contraseña ficticia, no debería usarse
        balance: 999999.00,
        group: "Sistema",
        canSend: false       // <--- Cuenta con restricción de envío
    },
    // Añade más usuarios aquí...
};

// ... el resto de la lógica JS ...

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

// ... después de las definiciones de userAccounts y las referencias al DOM

// Referencias a los nuevos elementos del DOM
const transferForm = document.getElementById('transfer-form');
const transferMessage = document.getElementById('transfer-message');

// Función auxiliar para actualizar el saldo en la interfaz
function updateBalanceUI(username) {
    const userData = userAccounts[username];
    // Formatear el saldo como dinero
    const formattedBalance = userData.balance.toLocaleString('es-ES', { 
        style: 'currency', 
        currency: 'EUR' // Puedes cambiar EUR por la moneda que desees
    });
    accountBalance.textContent = formattedBalance;
}

// Función auxiliar para mostrar mensajes (éxito/error)
function showMessage(text, type) {
    transferMessage.textContent = text;
    transferMessage.classList.remove('hidden');
    transferMessage.style.color = (type === 'error') ? 'red' : 'lightgreen';
    
    // Ocultar mensaje después de 3 segundos
    setTimeout(() => {
        transferMessage.classList.add('hidden');
    }, 3000);
}

// Función que maneja el envío de dinero
function handleTransfer(event) {
    event.preventDefault();

    const recipient = document.getElementById('recipient').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const sender = loggedInUser;
    const senderData = userAccounts[sender];

    // 1. **VERIFICACIÓN DE RESTRICCIÓN DE ENVÍO**
    if (!senderData.canSend) {
        showMessage("Error: No puedes enviar dinero desde esta cuenta (Restricción de envío).", 'error');
        return;
    }

    // 2. Verificaciones básicas
    if (!userAccounts[recipient]) {
        showMessage("Error: Cuenta destinataria no existe.", 'error');
        return;
    }

    if (amount <= 0 || isNaN(amount)) {
        showMessage("Error: Cantidad inválida.", 'error');
        return;
    }

    if (senderData.balance < amount) {
        showMessage("Error: Saldo insuficiente.", 'error');
        return;
    }
    
    // 3. **EJECUCIÓN DE LA TRANSFERENCIA SIMULADA**
    // Restamos al emisor y sumamos al receptor.
    senderData.balance -= amount;
    userAccounts[recipient].balance += amount;

    // 4. Actualizar la interfaz del emisor
    updateBalanceUI(sender);
    showMessage(`Transferencia exitosa de ${amount.toFixed(2)}€ a ${recipient}.`, 'success');
    
    // Limpiar formulario
    transferForm.reset();
}

// Modificar la función showBankScreen para mostrar el grupo
function showBankScreen(username) {
    const userData = userAccounts[username];
    
    // Ocultar login y mostrar banco
    loginContainer.classList.add('hidden');
    bankContainer.classList.remove('hidden');

    // Mostrar nombre de usuario y su grupo
    displayUsername.textContent = `Bienvenido, ${username} [Grupo: ${userData.group}]`;
    
    // Llamar a la función que actualiza el saldo
    updateBalanceUI(username);
}

// Añadir el "escuchador" de eventos para la transferencia
transferForm.addEventListener('submit', handleTransfer);

// ... el resto de tu código (handleLogin y handleLogout)
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

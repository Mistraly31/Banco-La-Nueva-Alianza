// ==========================================================
// 🎯 Zona de Configuración - ¡Puedes modificar esto!
// ==========================================================

// Objeto para almacenar todas las cuentas de usuario.
// Puedes añadir o modificar más usuarios aquí.
// ==========================================================
// 🎯 Zona de Configuración - ¡Modifica aquí los Usuarios!
// ==========================================================

// === 1. Configuración de Firebase y Autenticación ===
// Asegúrate de importar los SDKs en index.html: firebase-app.js, firebase-firestore.js, firebase-auth.js
const firebaseConfig = {
    // PEGA AQUÍ TU CONFIGURACIÓN
};
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth(); 
// === 2. ¡ELIMINA EL OBJETO userAccounts! (Ahora viene de Firestore) ===

// Referencias del DOM
const loginContainer = document.getElementById('login-container');
// ... otras referencias ...

let currentUserId = null; // Guardará el ID de Firestore (userId)
let userData = null; // Guardará los datos del usuario logueado

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

function handleTransfer(event) {
    event.preventDefault();

    const recipient = document.getElementById('recipient').value;
    const amount = parseFloat(document.getElementById('amount').value);
    
    // 1. Verificación de Restricción de Envío y Saldo (Aún se puede manipular)
    if (!userData.canSend) {
        showMessage("Error: No puedes enviar dinero desde esta cuenta.", 'error');
        return;
    }
    if (userData.balance < amount) {
        showMessage("Error: Saldo insuficiente.", 'error');
        return;
    }
    
    // **Paso 1: Buscar el ID del receptor**
    db.collection('accounts').where('username', '==', recipient).get()
    .then(snapshot => {
        if (snapshot.empty) {
            showMessage("Error: Cuenta destinataria no existe.", 'error');
            return;
        }

        const recipientDoc = snapshot.docs[0];
        const recipientId = recipientDoc.id;
        const recipientData = recipientDoc.data();

        // **Paso 2: DÉBITO (Actualizar el saldo del emisor)**
        // Esto depende de la Regla de Seguridad de Firestore.
        db.collection('accounts').doc(currentUserId).update({
            balance: firebase.firestore.FieldValue.increment(-amount)
        })
        .then(() => {
            // **Paso 3: CRÉDITO (Actualizar el saldo del receptor)**
            // ¡Esto podría fallar y dejar el débito sin el crédito! (INSEGURO)
            return db.collection('accounts').doc(recipientId).update({
                balance: firebase.firestore.FieldValue.increment(amount)
            });
        })
        .then(() => {
            showMessage(`Transferencia exitosa de ${amount.toFixed(2)}€ a ${recipient}.`, 'success');
        })
        .catch(error => {
            console.error("Error durante la transferencia:", error);
            showMessage("Error crítico en la transacción. ¡Revisa la consola!", 'error');
        });

    })
    .catch(error => {
        console.error("Error al buscar destinatario:", error);
    });

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

function handleLogin(event) {
    event.preventDefault(); 

    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    // **Paso 1: Simulación de Búsqueda de Usuario y Contraseña**
    // DEBERÍAS USAR firebase.auth().signInWithEmailAndPassword().
    // Aquí simularemos el login buscando el nombre de usuario directamente en Firestore.

    db.collection('accounts').where('username', '==', usernameInput).get()
    .then(snapshot => {
        if (snapshot.empty) {
            showLoginFailed();
            return;
        }
        
        const doc = snapshot.docs[0];
        const account = doc.data();

        // **Paso 2: Verificación de Contraseña (Aún inseguro)**
        if (account.password === passwordInput) {
            currentUserId = doc.id; // ¡Guardamos el ID de Firestore!
            
            // **Paso 3: Escuchar cambios en tiempo real (Persistencia)**
            db.collection('accounts').doc(currentUserId)
              .onSnapshot(docSnapshot => {
                // Se ejecuta cada vez que el saldo cambia en la base de datos
                userData = docSnapshot.data();
                showBankScreen(userData.username);
                updateBalanceUI();
              }, error => {
                console.error("Error al escuchar cambios:", error);
              });

        } else {
            showLoginFailed();
        }
    })
    .catch(error => {
        console.error("Error al iniciar sesión:", error);
        showLoginFailed();
    });

    loginForm.reset();
}

// Actualización de la UI basada en el objeto userData (que se actualiza en tiempo real)
function updateBalanceUI() {
    if (userData) {
        const formattedBalance = userData.balance.toLocaleString('es-ES', { 
            style: 'currency', 
            currency: 'EUR'
        });
        accountBalance.textContent = formattedBalance;
    }
}

function showBankScreen(username) {
    loginContainer.classList.add('hidden');
    bankContainer.classList.remove('hidden');
    displayUsername.textContent = `Bienvenido, ${username} [Grupo: ${userData.group}]`;
    updateBalanceUI();
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

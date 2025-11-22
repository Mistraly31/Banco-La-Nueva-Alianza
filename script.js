// ==========================================================
// 1. CONEXIÓN Y CONFIGURACIÓN DE FIREBASE
// ==========================================================

const firebaseConfig = {
    // PEGA AQUÍ TU CONFIGURACIÓN COMPLETA DE FIREBASE
    apiKey: "AIzaSyBROhe67iKhC5OZgsBhMmoZC-9_HJxnw0E",
    authDomain: "bancolanuevaalianza.firebaseapp.com",
    projectId: "bancolanuevaalianza",
    storageBucket: "bancolanuevaalianza.firebasestorage.app",
    messagingSenderId: "493921687826",
    appId: "1:493921687826:web:abdf11a1ead603916efbcb",
    measurementId: "G-BPFNDD7JTC"
};

// Inicializa Firebase (requiere que los SDKs estén enlazados en index.html)
firebase.initializeApp(firebaseConfig);

// Asigna los servicios de Firebase
const db = firebase.firestore();
const auth = firebase.auth(); 

// ==========================================================
// 2. VARIABLES GLOBALES Y REFERENCIAS DEL DOM
// ==========================================================

// Variables globales para el estado del usuario logueado
let currentUserId = null; // ID del documento en Firestore
let userData = null;      // Datos del usuario (saldo, grupo, canSend)

// Referencias a elementos HTML (Consolidado)
const loginContainer = document.getElementById('login-container');
const bankContainer = document.getElementById('bank-container');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const errorMessage = document.getElementById('error-message');
const displayUsername = document.getElementById('display-username');
const accountBalance = document.getElementById('account-balance');
const transferForm = document.getElementById('transfer-form');
const transferMessage = document.getElementById('transfer-message');

// ==========================================================
// 3. FUNCIONES DE INTERFAZ (UI)
// ==========================================================

function showLoginFailed() {
    loginContainer.classList.add('hidden');
    bankContainer.classList.add('hidden');
    errorMessage.classList.remove('hidden');

    setTimeout(() => {
        errorMessage.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    }, 2000);
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

function showMessage(text, type) {
    transferMessage.textContent = text;
    transferMessage.classList.remove('hidden');
    transferMessage.style.color = (type === 'error') ? 'red' : 'lightgreen';
    
    setTimeout(() => {
        transferMessage.classList.add('hidden');
    }, 3000);
}

// Muestra la pantalla del banco, usando el userData cargado de Firestore
function showBankScreen(username) {
    loginContainer.classList.add('hidden');
    bankContainer.classList.remove('hidden');
    
    // Muestra el nombre de usuario y su grupo
    displayUsername.textContent = `Bienvenido, ${username} [Grupo: ${userData.group}]`;
    updateBalanceUI();
}

// ==========================================================
// 4. LÓGICA DE LA APLICACIÓN (LOGIN, TRANSFERENCIA, LOGOUT)
// ==========================================================

function handleLogin(event) {
    event.preventDefault(); 

    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    // 1. Buscar el documento en Firestore por el nombre de usuario
    db.collection('accounts').where('username', '==', usernameInput).get()
    .then(snapshot => {
        if (snapshot.empty) {
            showLoginFailed();
            return;
        }
        
        const doc = snapshot.docs[0];
        const account = doc.data();

        // 2. Verificar la contraseña (INSEGURO)
        if (account.password === passwordInput) {
            currentUserId = doc.id; // Guardamos el ID de Firestore
            
            // 3. Establecer el escuchador en tiempo real (onSnapshot)
            db.collection('accounts').doc(currentUserId)
              .onSnapshot(docSnapshot => {
                userData = docSnapshot.data(); // Actualizamos userData con los últimos datos
                showBankScreen(userData.username);
                // updateBalanceUI() se llama dentro de showBankScreen
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
            // El saldo del emisor se actualizará automáticamente gracias a onSnapshot
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

function handleLogout() {
    // Aquí podrías cerrar sesión con Firebase Auth si lo estuvieras usando completamente.
    // auth.signOut(); 
    
    bankContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    
    // Limpiar variables de estado
    currentUserId = null; 
    userData = null;
}

// ==========================================================
// 5. ASIGNACIÓN DE EVENTOS
// ==========================================================

loginForm.addEventListener('submit', handleLogin);
logoutButton.addEventListener('click', handleLogout);
transferForm.addEventListener('submit', handleTransfer);

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
    
    // Verificación 1: Restricción de Envío y Saldo (Local)
    if (!userData || userData.canSend === false) {
        showMessage("Error: No puedes enviar dinero desde esta cuenta.", 'error');
        return;
    }
    if (userData.balance < amount) {
        showMessage("Error: Saldo insuficiente localmente.", 'error');
        return;
    }
    
    // **NUEVA VERIFICACIÓN:** Evitar transferencia a uno mismo (soluciona el error de permisos)
    if (userData.username === recipient) {
        showMessage("Error: No puedes transferir dinero a tu propia cuenta.", 'error');
        return;
    }

    // Paso 1: Buscar el documento del destinatario
    db.collection('accounts').where('username', '==', recipient).get()
    .then(snapshot => {
        if (snapshot.empty) {
            // **CORRECCIÓN 1:** Si no existe, muestra el mensaje y finaliza correctamente.
            showMessage("Error: Cuenta destinataria no existe.", 'error');
            return; // Devuelve nada para que la siguiente cadena de .then no se ejecute
        }

        const recipientDoc = snapshot.docs[0];
        const recipientRef = recipientDoc.ref;
        const senderRef = db.collection('accounts').doc(currentUserId); 

        // -----------------------------------------------------------------
        // **INICIO DE LA TRANSACCIÓN**
        // -----------------------------------------------------------------
        return db.runTransaction(transaction => {
            
            return transaction.get(senderRef).then(senderDoc => {
                const senderBalance = senderDoc.data().balance;

                if (senderBalance < amount) {
                    throw "Error de Saldo Insuficiente"; 
                }

                // 3. EJECUTAR DÉBITO (Restar al emisor)
                const newSenderBalance = senderBalance - amount;
                transaction.update(senderRef, { balance: newSenderBalance });

                // 4. EJECUTAR CRÉDITO (Sumar al receptor)
                transaction.update(recipientRef, { 
                    balance: firebase.firestore.FieldValue.increment(amount) 
                });
            });
        });
    })
    .then(() => {
        // Esta parte solo se ejecuta si la promesa anterior fue exitosa (incluyendo la Transacción)
        showMessage(`Transferencia exitosa de ${amount.toFixed(2)}€ a ${recipient}.`, 'success');
    })
    .catch(error => {
        // Manejo de errores de la Transacción o de la búsqueda inicial
        console.error("Error durante la transferencia:", error);
        if (typeof error === 'string' && error.includes('Saldo')) {
            showMessage(`Error: Saldo insuficiente.`, 'error');
        } else if (error.code && error.code === 'permission-denied') {
            showMessage("Error: Permiso denegado por reglas de seguridad. (Intento de transferencia inválida).", 'error');
        } else {
            showMessage("Error: Transacción fallida. Revisa la consola.", 'error');
        }
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

const showToast = (msg, isError = false) => {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'toast ' + (isError ? 'error' : 'success');
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
};

document.addEventListener('DOMContentLoaded', () => {
    
    // Check if user is logged in
    fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
            if (data.user) {
                // Determine redirect path
                let dest = '/';
                if (data.user.role === 'patient') dest = '/dashboard';
                if (data.user.role === 'doctor') dest = '/dashboard';
                if (data.user.role === 'admin') dest = '/dashboard';
                
                // If they are on auth pages, redirect them to dashboard
                if (window.location.pathname.includes('login') || window.location.pathname.includes('register')) {
                    window.location.href = dest;
                }
            }
        }).catch(err => console.log('Not logged in'));

    // Handle Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            const errDiv = document.getElementById('authError');
            
            errDiv.style.display = 'none';
            btn.disabled = true;
            btn.innerHTML = 'Signing in... <i class="fa-solid fa-spinner fa-spin"></i>';

            const payload = {
                email: loginForm.email.value,
                password: loginForm.password.value
            };

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                
                if (!res.ok) {
                    throw new Error(data.error || 'Login failed');
                }

                showToast('Login successful!');
                setTimeout(() => window.location.href = '/dashboard', 1000);

            } catch (err) {
                errDiv.textContent = err.message;
                errDiv.style.display = 'block';
                btn.disabled = false;
                btn.innerHTML = '<span class="btn-text">Sign In</span> <i class="fa-solid fa-right-to-bracket"></i>';
            }
        });
    }

    // Handle Register
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('registerBtn');
            const errDiv = document.getElementById('authError');
            
            errDiv.style.display = 'none';
            btn.disabled = true;
            btn.innerHTML = 'Registering... <i class="fa-solid fa-spinner fa-spin"></i>';

            const payload = {
                name: registerForm.name.value,
                email: registerForm.email.value,
                password: registerForm.password.value,
                phone: registerForm.phone.value,
                age: registerForm.age.value,
                gender: registerForm.gender.value,
            };

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                
                if (!res.ok) {
                    throw new Error(data.error || 'Registration failed');
                }

                showToast('Registration successful!');
                setTimeout(() => window.location.href = '/dashboard', 1000);

            } catch (err) {
                errDiv.textContent = err.message;
                errDiv.style.display = 'block';
                btn.disabled = false;
                btn.innerHTML = '<span class="btn-text">Register Now</span> <i class="fa-solid fa-user-plus"></i>';
            }
        });
    }

});

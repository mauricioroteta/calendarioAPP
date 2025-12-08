/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#333333',
                secondary: '#757575',
                accent: '#000000',
            },
            fontFamily: {
                sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                serif: ['Times New Roman', 'serif'],
                script: ['Dancing Script', 'cursive', 'serif'],
            },
            boxShadow: {
                '3d': '0 10px 40px -10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.1)',
                '3d-hover': '0 20px 60px -10px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 0, 0, 0.15)',
                'deep': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                'lifted': '0 15px 35px rgba(0, 0, 0, 0.2), 0 5px 15px rgba(0, 0, 0, 0.12)',
            },
            animation: {
                'fade-slide-up': 'fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'subtle-heartbeat': 'subtleHeartbeat 3s infinite ease-in-out',
                'slide-up-fade': 'slideUpFade 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) forwards',
            },
            keyframes: {
                fadeSlideUp: {
                    'from': {
                        opacity: '0',
                        transform: 'translateY(20px) scale(0.95)',
                    },
                    'to': {
                        opacity: '1',
                        transform: 'translateY(0) scale(1)',
                    },
                },
                subtleHeartbeat: {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.2)' },
                    '100%': { transform: 'scale(1)' },
                },
                slideUpFade: {
                    '0%': {
                        opacity: '0',
                        transform: 'translateY(20px) scale(0.98)',
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'translateY(0) scale(1)',
                    },
                },
            },
            transitionDuration: {
                '700': '700ms',
            },
            transitionTimingFunction: {
                'smooth': 'cubic-bezier(0.22, 0.61, 0.36, 1)',
            },
        },
    },
    plugins: [],
}

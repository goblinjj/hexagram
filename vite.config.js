import { resolve } from 'path'

export default {
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                study: resolve(__dirname, 'study.html'),
            }
        }
    }
}

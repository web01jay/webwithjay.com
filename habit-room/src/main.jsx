import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import router from './routes/AppRoutes.jsx'
import { RouterProvider } from 'react-router-dom'
import './sass/style.scss';
import './gloable.scss';


// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <RouterProvider router={router} />
//   </StrictMode>,
// )

createRoot(root).render(
    <RouterProvider
        router={router}
        future={{
            v7_startTransition: true,
        }}
    />,
);

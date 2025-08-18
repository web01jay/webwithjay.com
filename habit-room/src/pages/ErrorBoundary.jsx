// src/pages/ErrorBoundary.jsx
import { useRouteError } from 'react-router-dom';
import { Button, Result } from 'antd';

export default function ErrorBoundary() {
    const error = useRouteError();
    console.error(error);

    return (
        <Result
            status="500"
            title="500"
            subTitle="Sorry, something went wrong."
            extra={<Button type="primary">Back Home</Button>}
        />
    );
}

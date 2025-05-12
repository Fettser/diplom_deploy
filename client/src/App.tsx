import React, { useState } from 'react';
import styles from './App.module.css';
import { Form } from './components/Form/Form';
import { Viewer } from './components/Viewer/Viewer';

export interface IData {
    matrix: [number, number, number][][];
    peaks: [number, number];
}

function App() {
    const [restored, setRestored] = useState<IData>()
    const [error, setError] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const onSubmit = (data: FormData) => {
        setLoading(true)
        setError(false)
        fetch('/api/restore', {
            method: 'POST',
            body: data
        }).then((res) => res.json()).then((res) => {
            setRestored(res)
        }).catch(e => {
            setError(true)
        }).finally(() => {
            setLoading(false)
        })
    }
    return (
        <div className={styles.container}>
            <Form loading={loading} onSubmit={onSubmit} />
            <Viewer loading={loading} error={error} data={restored}/>
        </div>
    );
}

export default App;

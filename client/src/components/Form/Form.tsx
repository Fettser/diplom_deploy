import React, { ChangeEvent, FC, FormEvent, useEffect, useRef, useState } from 'react'
import {Button, Card, Checkbox, Flex, Icon, Text, TextInput} from '@gravity-ui/uikit';
import {Xmark} from '@gravity-ui/icons';
import styles from './Form.module.css';

interface IFormProps {
    onSubmit: (data: FormData) => void;
    loading: boolean
}

async function getImageDimensions(file: File) {
    return new Promise<{width: number; height: number}>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({
            width: img.naturalWidth,
            height: img.naturalHeight
        });
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

export const Form: FC<IFormProps> = ({ onSubmit, loading }) => {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [preview, setPreview] = useState<string>('')
    const [useMask, setUseMask] = useState(false)
    const [maskRadius, setMaskRadius] = useState(0)
    const [file, setFile] = useState<File | null>(null)
    const [size, setSize] = useState<{width: number; height: number} | undefined>()

    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null
        event.target.value = ''
        setFile(file)
    }

    const onSubmitHandler = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        if (file) {
            data.append('file', file)
        }
        onSubmit(data)
    }

    const onFileRemove = () => {
        setFile(null)
        if (inputRef.current) {
            inputRef.current.value = ''
        }
    }

    const onClickButton = () => {
        inputRef.current?.click()
    }

    const onUpdateRadius = (value: string) => {
        const nValue = Number(value) || 0
        if (nValue >= 0) {
            setMaskRadius(nValue)
        }
    }

    useEffect(() => {
        const fileHandler = async (uploadedFile: File | null) => {
            if (uploadedFile) {
                const size = await getImageDimensions(uploadedFile)
                setSize(size)
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreview(reader.result as string);
                };
                reader.readAsDataURL(uploadedFile);
            } else {
                setSize(undefined)
                setPreview('')
            }
        }
        fileHandler(file)
    }, [file])

    return (
        <>
            <Card view='raised' className={styles.container}>
                {file ? (
                    <>
                        <Flex justifyContent='space-between' alignItems='center' className={styles.info}>
                            <Text ellipsis>{file.name}</Text>
                            <Button onClick={onFileRemove}>
                                <Icon data={Xmark} />
                            </Button>
                        </Flex>
                        {preview && size && (
                            <svg width={280} height={280 * (size.height / size.width)} viewBox={`0 0 280 ${280 * (size.height / size.width)}`}>
                                <defs>
                                    {useMask && (
                                        <clipPath id="circleMask">
                                            <circle cx={140} cy={280 * (size.height / size.width) / 2} r={maskRadius * (280 / size.width)} />
                                        </clipPath>
                                    )}
                                </defs>
                                <image 
                                    x="0" 
                                    y="0" 
                                    width={280} 
                                    height={280 * (size.height / size.width)}
                                    href={preview} 
                                    clipPath="url(#circleMask)"
                                    preserveAspectRatio="xMidYMid slice"
                                />
                            </svg>
                        )}
                    </>
                ) : (
                    <Card className={styles.image_placeholder}>
                        <Button width='auto' onClick={onClickButton}>Загрузить</Button>
                    </Card>
                )}
                <form onSubmit={onSubmitHandler}>
                    <Flex direction='column' gap={2}>
                        <input accept='image/*' ref={inputRef} hidden type='file' onChange={onChange}/>
                        <Checkbox disabled={!preview} onUpdate={(checked) => setUseMask(checked)}>Применить маску</Checkbox>
                        {preview && useMask && (
                            <TextInput type='number' name='radius' value={String(maskRadius)} onUpdate={onUpdateRadius} placeholder='Радиус маски'/>
                        )}
                        <Flex gap={2} alignItems='center'>
                            <Text whiteSpace='nowrap'>Длина волны, нм</Text>
                            <TextInput name='lambda' type='number'/>
                        </Flex>
                        <Flex gap={2} alignItems='center' wrap='nowrap'>
                            <Text whiteSpace='nowrap'>Наклон по X</Text>
                            <TextInput className={styles.size_input} name='xAngle' placeholder='рад' />
                            <Text whiteSpace='nowrap'>и Y</Text>
                            <TextInput className={styles.size_input} name='yAngle' placeholder='рад' />
                        </Flex>
                        <Flex gap={2} alignItems='center' wrap='nowrap'>
                            <Text whiteSpace='nowrap'>Размер по X</Text>
                            <TextInput className={styles.size_input} name='xSize' placeholder='мм' />
                            <Text whiteSpace='nowrap'>или Y</Text>
                            <TextInput className={styles.size_input} name='ySize' placeholder='мм' />
                        </Flex>
                        <Button view='action' type='submit' disabled={!file || loading}>Восстановить</Button>
                    </Flex>
                </form>
            </Card>
        </>
    )
}
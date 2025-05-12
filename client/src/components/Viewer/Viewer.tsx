import React, {FC, forwardRef, useMemo} from 'react'
import { Card, Loader, Text} from '@gravity-ui/uikit';
import styles from './Viewer.module.css'
import * as echarts from 'echarts';
import { useEffect, useRef } from 'react';
import { IData } from '../../App';

import 'echarts-gl'

interface IViewerProps {
    data?: IData
    error: boolean
    loading: boolean
}

type IChartProps = Pick<IViewerProps, 'data'>

const getStatus = (error: boolean, loading: boolean, data?: IData) => {
    if (!data && !error && !loading) {
        return <Text>Данные отсутствуют</Text>
    }

    if (loading) {
        return <Loader />
    }

    if (error) {
        return <Text color="danger">При обработке данных произошла ошибка</Text>
    }

    return null
}

const Chart: FC<IChartProps> = ({data}) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const option = useMemo(() => {
        return {
            tooltip: {},
            backgroundColor: '#fff',
            visualMap: {
                show: false,
                dimension: 2,
                min: data?.peaks[0],
                max: data?.peaks[1],
                inRange: {
                    color: [
                        '#313695', '#4575b4', '#74add1', '#abd9e9', 
                        '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', 
                        '#f46d43', '#d73027', '#a50026'
                    ]
                }
            },
            xAxis3D: {
                type: 'value'
            },
            yAxis3D: {
                type: 'value'
            },
            zAxis3D: {
                type: 'value'
            },
            grid3D: {
                viewControl: {
                    distance: 120,
                    alpha: 40,
                    beta: 70,
                    rotateSensitivity: 1
                },
                light: {
                    main: {
                        intensity: 1.5,
                        shadow: true,
                        shadowQuality: 'high',
                        alpha: 40,
                        beta: 40
                    },
                    ambient: {
                        intensity: 0.7
                    }
                },
                postEffect: {
                    enable: true,
                    SSAO: {
                        enable: true,
                        radius: 2,
                        intensity: 1
                    }
                }
            },
            series: [{
                type: 'surface',
                wireframe: {
                    show: true
                },
                shading: 'realistic',
                realisticMaterial: {
                    roughness: 0.5,
                    metalness: 0
                },
              data: data?.matrix,
            }]
        };
    }, [data])

    useEffect(() => {
        let chart: echarts.ECharts | undefined;
        if (containerRef.current !== null) {
            chart = echarts.init(containerRef.current);
        }

        function resizeChart() {
          chart?.resize();
        }

        window.addEventListener("resize", resizeChart);
    
        return () => {
          chart?.dispose();
          window.removeEventListener("resize", resizeChart);
        };
      }, []);

    useEffect(() => {
        if (containerRef.current !== null) {
          const chart = echarts.getInstanceByDom(containerRef.current);
          chart?.setOption(option);
        }
    }, [option])

    return (
        <Card view='raised' ref={containerRef} className={styles.container}>
            {null}
        </Card>
    )
}

export const Viewer: FC<IViewerProps> = ({data, error, loading}) => {
    const status = getStatus(error, loading, data)
    if (status) {
        return (
            <Card view='raised' className={styles.container}>
                {status}
            </Card>
        )    
    }

    return (
        <Chart data={data} />
    )
}
import React, { useEffect, useState } from 'react';
import { Collapse, Form, Input, InputNumber, notification, Modal } from 'antd'; 

const { Panel } = Collapse;

function Configuration({config}) {
    const [servers, setServers] = useState([]);
    const [api, contextHolder2] = notification.useNotification();
    const [modalVisible, setModalVisible] = useState(false);
    const [newServerName, setNewServerName] = useState('');

    useEffect(() => {
        fetch(config.backendUrl + '/api/servers')
            .then((response) => response.json())
            .then((data) => setServers(data));
    }, []);

useEffect(() => {
    if (servers.length > 0) {
        save();
    }
}, [servers]); // Run the effect whenever `servers` changes except when it's first rendered

    const openNotification = (title,message ) => {
        api.open({
        message: title,
        description: message,
        });
    };

    const addServer = () => {
        setModalVisible(true);
    }
    
    const handleOk = () => {
        const newServers = [...servers];
        newServers.push({ sitename: newServerName, host: '', port: 22, user: '', pass: '', remoteDir: '', localDir: '/www/Backups' }); 
        setServers(newServers);
        setModalVisible(false);
        setNewServerName('');
    }
    
    const handleCancel = () => {
        setModalVisible(false);
    }

    const deleteServerConfirmed = (index) => {
        const newServers = [...servers];
        newServers.splice(index, 1); 
        setServers(newServers);
    }

    const handleInputChange = (index, prop) => (e) => {
        const newServers = [...servers];
        newServers[index][prop] = e.target.value;
        setServers(newServers);
    }

    const handleNumberChange = (index, prop) => (value) => {
        const newServers = [...servers];
        newServers[index][prop] = value;
        setServers(newServers);
    }

    const backupAllServers = async () => {
        for (let i = 0; i < servers.length; i++) {
            await backupOnly(i);
        }
    }

    const showDeleteConfirm = (index) => {
        Modal.confirm({
          title: 'Are you sure delete this Server?',
          content: 'This action is permanent and cannot be undone.',
          okText: 'Yes',
          okType: 'danger',
          cancelText: 'No',
          onOk() {
            deleteServerConfirmed(index);
          },
          onCancel() {
            console.log('Cancel');
          },
        });
      }

    const backupOnly = async (index) => {
        console.log(`About to back up solo server ${index}`);
    
        var jsonData = {
            backupServer: index
        };
    
        try {
            const response = await fetch(config.backendUrl + '/backup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonData),
            });
      
            if (response.ok) {
                openNotification('Success', 'Backup Completed Successfully');
            } else {
                openNotification('Error', 'Could not complete that backup');
            }

        } catch (error) {
            console.log('Error in solo backup ', error);

        } finally {
            
        }
    }

    const save = async () => {
        const response = await fetch(config.backendUrl + '/api/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(servers),
        });

        if (response.ok) {
            // openNotification('Success', 'Data saved successfully');
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    }

    return (
        <div className="configuration">
            <h1>Backup the Backups</h1>
            <button onClick={addServer} className="configuration-button" style={{marginBottom: 20}}>Add Server</button> &nbsp;&nbsp;
            <button onClick={backupAllServers} className="configuration-button">Download All</button>
            <Collapse accordion>
                {servers.map((server, index) => (
                    <Panel header={server.sitename} key={index + 1}>
                        <Form className="configuration-form">
                            <Form.Item label="Host" className="configuration-form-item">
                                <Input value={server.host} placeholder="Hostname of Server to backup" onChange={handleInputChange(index, 'host')} className="configuration-input"/>
                            </Form.Item>
                            <Form.Item label="Port" className="configuration-form-item">
                                <InputNumber value={server.port} defaultValue={22} onChange={handleNumberChange(index, 'port')} className="configuration-input-number"/>
                            </Form.Item>
                            <Form.Item label="User" className="configuration-form-item">
                                <Input value={server.user} onChange={handleInputChange(index, 'user')} className="configuration-input"/>
                            </Form.Item>
                            <Form.Item label="Password" className="configuration-form-item">
                                <Input value={server.pass} onChange={handleInputChange(index, 'pass')} className="configuration-input"/>
                            </Form.Item>
                            <Form.Item label="Remote Directory" className="configuration-form-item">
                                <Input value={server.remoteDir} onChange={handleInputChange(index, 'remoteDir')} className="configuration-input"/>
                            </Form.Item>
                            <Form.Item label="Backup to" className="configuration-form-item">
                                <Input value={server.localDir} onChange={handleInputChange(index, 'localDir')} className="configuration-input" />
                            </Form.Item>
                            <div className="button-span">
                                <button onClick={()=>backupOnly(index)} className="configuration-button">Download this Server only</button>
                            </div>
                            <div className='delete-server'>
                            <button onClick={()=>showDeleteConfirm(index)} className="configuration-button">Delete Server</button>
                            </div>
                        </Form>
                    </Panel> 
                ))}
            </Collapse>
            <Modal
            title="Add Server"
            visible={modalVisible}
            onOk={handleOk}
            onCancel={handleCancel}
        >
            <Input
                value={newServerName}
                onChange={e => setNewServerName(e.target.value)}
                placeholder="Enter server name"
            />
        </Modal>
            {contextHolder2}
        </div>
    );
}

export default Configuration;
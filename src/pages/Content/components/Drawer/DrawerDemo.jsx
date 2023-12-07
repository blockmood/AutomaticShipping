import React, { useEffect, useRef, useState } from 'react';
import { Drawer, Button, Table, Upload, message, Tabs } from 'antd';
import cookie from 'cookiejs';
import * as XLSX from 'xlsx';
import TongJi from '../Fahuo/index';
import ExportProduct from '../ExportProduct/index';
import Yuanjixin from '../Yuanjixin/index';

const Origin = window.location.origin;

export default (props) => {
  const [open, setOpen] = useState(false);
  const workRef = useRef();
  const [data, setData] = useState([]);
  const [logistics, setLogistics] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.addEventListener(
      'message',
      (e) => {
        if (e.data.source !== 'react-devtools-content-script') {
          if (e.data.key === 'showDrawer') {
            getLogistics();
            setOpen(!open);
          }
        }
      },
      false
    );
  }, []);

  useEffect(() => {
    getLogistics();
  }, []);

  const getLogistics = async () => {
    //获取物流信息
    const response = await fetch(
      `${Origin}/adminapi/order/express_list?status=`,
      {
        headers: {
          'Authori-Zation': `Bearer ${cookie.get('token')}`,
        },
      }
    ).then((res) => res.json());
    if (response.status === 110003) {
      setVisible(true);
      return;
    }
    setLogistics(response.data);
  };

  const updateChange = (info) => {
    let data = [];
    const fileReader = new FileReader();
    fileReader.readAsBinaryString(info.file);
    fileReader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target?.result, { type: 'binary' });
        for (const sheet in workbook.Sheets) {
          if (workbook.Sheets.hasOwnProperty(sheet)) {
            let result = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
            console.log(result);
            workRef.current = result;
            getOrderList(result);
          }
        }
      } catch (e) {
        throw new Error('error');
      }
    };
  };

  const getOrderList = async (data) => {
    setLoading(true);
    try {
      // 使用 Promise.all 来等待所有异步操作完成
      await Promise.all(
        data.map(async (items) => {
          await fetchData(items['订单号']);
        })
      );
    } catch (error) {
      // 处理错误，例如在发生异常时设置错误状态
      console.error('An error occurred:', error);
    }
    setLoading(false);
  };

  const fetchData = async (id) => {
    const response = await fetch(
      `${Origin}/adminapi/order/list?page=1&limit=10&status=&pay_type=&data=&real_name=${id}&field_key=all&type=`,
      {
        headers: {
          'Authori-Zation': `Bearer ${cookie.get('token')}`,
        },
      }
    ).then((res) => res.json());
    if (response.status === 110003) {
      setVisible(true);
      return;
    }

    if (
      response.data.data[0].status_name.status_name === '未发货' &&
      response.data.data[0]._status === 2
    ) {
      setData((data) => {
        return [...data, ...response.data.data];
      });
    }
  };

  const updateProps = {
    name: 'file',
    beforeUpload: () => {
      setData([]);
      workRef.current = [];
      return false;
    },
    onChange: updateChange,
  };

  const columns = [
    {
      title: 'id',
      dataIndex: 'id',
      width: 80,
      key: 'id',
    },
    {
      title: '订单号',
      width: 100,
      dataIndex: 'order_id',
      key: 'order_id',
    },
    {
      title: '商品信息',
      dataIndex: '_info',
      key: '_info',
      width: 300,
      render: (info) => {
        return Object.keys(info).map((items, index) => {
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <img
                width={60}
                src={info[items]['cart_info'].productInfo.slider_image[0]}
              />
              {info[items]['cart_info'].productInfo.store_name}
            </div>
          );
        });
      },
    },
    {
      title: '订单状态',
      dataIndex: 'status_name',
      key: 'status_name',
      width: 100,
      render: (status, info) => {
        return (
          <div>
            {status.status_name === '未发货' ? (
              <p style={{ color: 'red' }}>{status.status_name}</p>
            ) : (
              status.status_name
            )}{' '}
            <br />
            {!info.refund.length ? null : '可能是退款中（不一定准确）'}
          </div>
        );
      },
    },
    {
      title: '收货人',
      width: 100,
      dataIndex: 'real_name',
      key: 'real_name',
    },
    {
      width: 80,
      title: '电话',
      dataIndex: 'user_phone',
      key: 'user_phone',
    },
    {
      width: 160,
      title: '收货地址',
      dataIndex: 'user_address',
      key: 'user_address',
    },
    {
      title: '快递单号',
      width: 120,
      render: (items) => {
        return workRef.current.map((items2) => {
          if (items.order_id === items2['订单号']) {
            return (
              <div>
                {String(items2['快递'])} <br />
                {String(items2['快递单号']).includes(',')
                  ? String(items2['快递单号'])
                      .split(',')
                      .map((items) => <p>{items}</p>)
                  : String(items2['快递单号'])}
              </div>
            );
          }
        });
      },
    },
    {
      title: '一键发货',
      width: 80,
      render: (items) => {
        if (
          items._status === 2 &&
          items.status_name.status_name === '未发货' &&
          !items.refund.length
        ) {
          return (
            <Button
              onClick={() => {
                workRef.current.map((items2) => {
                  if (
                    items.order_id === items2['订单号'].replace('\n', '').trim()
                  ) {
                    saveSendOutGoods(items, items2);
                  }
                });
              }}
            >
              一键发货
            </Button>
          );
        } else {
          return <Button disabled>发货成功</Button>;
        }
      },
    },
  ];

  const saveSendOutGoods = async (data1, data2) => {
    if (!data2['快递']) {
      message.error('请检查表格是否正常');
      return;
    }

    const wl = logistics.find((items) => items.value === data2['快递']);

    let body = {
      type: '1',
      express_record_type: '1',
      delivery_name: data2['快递'],
      delivery_id: String(data2['快递单号']),
      express_temp_id: '',
      to_name: '',
      to_tel: '',
      to_addr: '',
      sh_delivery: '',
      fictitious_content: '',
      id: '',
      to_add: '',
      export_open: false,
      delivery_code: wl.code,
    };

    const response = await fetch(
      `${Origin}/adminapi/order/delivery/${data1.id}`,
      {
        method: 'PUT',
        headers: {
          'Authori-Zation': `Bearer ${cookie.get('token')}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify(body),
      }
    ).then((res) => res.json());
    if (response.status === 110003) {
      setVisible(true);
      return;
    }
    if (response.status === 200) {
      message.success(response.msg);
      updateData(data1.order_id);
    } else {
      message.error(response.msg);
    }
  };

  const updateData = async (id) => {
    const response = await fetch(
      `${Origin}/adminapi/order/list?page=1&limit=10&status=&pay_type=&data=&real_name=${id}&field_key=all&type=`,
      {
        headers: {
          'Authori-Zation': `Bearer ${cookie.get('token')}`,
        },
      }
    ).then((res) => res.json());

    setData((data) => {
      return data.map((items) => {
        if (items.id === response.data.data[0].id) {
          return {
            ...items,
            ...response.data.data[0],
          };
        } else {
          return items;
        }
      });
    });
  };

  const items = [
    {
      key: '1',
      label: '一件发货',
      children: (
        <>
          <div style={{ display: 'flex' }}>
            <Upload {...updateProps} fileList={[]}>
              <Button type="primary">上传excel</Button>
            </Upload>
          </div>
          <div style={{ marginBottom: 20 }}></div>
          <Table
            size="small"
            dataSource={data}
            columns={columns}
            rowKey="id"
            pagination={false}
            loading={loading}
          ></Table>
        </>
      ),
    },
    {
      key: '2',
      label: '数据统计',
      children: <TongJi />,
    },
    {
      key: '3',
      label: '导出商品信息',
      children: <ExportProduct />,
    },
    {
      key: '4',
      label: '导出京东京造商品信息',
      children: <Yuanjixin />,
    },
  ];

  return (
    <Drawer
      width={1800}
      title="一键发货系统"
      getContainer={document.querySelector(
        '#chrome-extension-content-base-element'
      )}
      open={open}
      onClose={() => {
        setOpen(false);
        setData([]);
        workRef.current = [];
      }}
      destroyOnClose={true}
    >
      <Tabs defaultActiveKey="1" items={items} />
    </Drawer>
  );
};

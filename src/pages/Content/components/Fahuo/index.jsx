import React, { useRef, useState } from 'react';
import { Button, Table, Upload, message, DatePicker, InputNumber } from 'antd';
import cookie from 'cookiejs';
import * as XLSX from 'xlsx';
import locale from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
const { RangePicker } = DatePicker;

export default () => {
  const [data, setData] = useState([]);
  const [count, setCount] = useState(2000);
  const [loading, setLoading] = useState(false);
  const timeRef = useRef({
    start: dayjs().format('YYYY/MM/DD'),
    end: dayjs().format('YYYY/MM/DD'),
  });

  const getProductList = async () => {
    setLoading(true);
    const response = await fetch(
      `${
        window.location.origin
      }/adminapi/statistic/product/get_product_ranking?limit=${count}&page=1&sort=visit&data=${encodeURI(
        timeRef.current.start
      )}-${encodeURI(timeRef.current.end)}`,
      {
        headers: {
          'Authori-Zation': `Bearer ${cookie.get('token')}`,
        },
      }
    )
      .then((res) => res.json())
      .catch((err) => {
        message.error('请求量数据太大，请调整');
        setLoading(false);
      });
    if (response.status === 200) {
      //拼接表格数据
      const ct = data.reduce((val, item) => {
        let res = response.data.find((i) => i.product_id == item.id);
        return res
          ? val.concat({
              ...item,
              ...res,
            })
          : null;
      }, []);

      setData(ct);
      setLoading(false);
    }
  };

  const getParameterByName = (name, url) => {
    if (!url) url = window.location.href;
    name = name.replace(/[[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  };

  const updateChange = (info) => {
    const fileReader = new FileReader();
    fileReader.readAsBinaryString(info.file);
    fileReader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target?.result, { type: 'binary' });
        for (const sheet in workbook.Sheets) {
          if (workbook.Sheets.hasOwnProperty(sheet)) {
            let result = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
            let newVal = result.map((items) => {
              return {
                id: items['页面URL'].includes('http')
                  ? getParameterByName('id', items['页面URL'])
                  : items['页面URL'],
              };
            });
            setData(newVal);
          }
        }
      } catch (e) {
        throw new Error('上传数据格式有问题', e);
      }
    };
  };

  const onChangeTime = (time) => {
    timeRef.current = {
      start: dayjs(time[0]).format('YYYY/MM/DD'),
      end: dayjs(time[1]).format('YYYY/MM/DD'),
    };
  };

  const updateProps = {
    name: 'file',
    beforeUpload: () => {
      return false;
    },
    onChange: updateChange,
  };

  const columns = [
    {
      title: '商品ID',
      dataIndex: 'id',
      width: 60,
      key: 'id',
    },
    {
      width: 100,
      title: '商品名称',
      dataIndex: 'store_name',
      key: 'store_name',
    },
    {
      title: '浏览量',
      width: 80,
      dataIndex: 'visit',
      key: 'visit',
    },
    {
      title: '访客数',
      width: 80,
      dataIndex: 'user',
      key: 'user',
    },
    {
      width: 100,
      title: '下单数',
      dataIndex: 'orders',
      key: 'orders',
    },
    {
      width: 100,
      title: '支付数',
      dataIndex: 'pay',
      key: 'pay',
    },
    {
      width: 100,
      title: '支付金额',
      dataIndex: 'price',
      key: 'price',
    },
    {
      width: 80,
      title: '收藏数',
      dataIndex: 'collect',
      key: 'collect',
      render: (_) => {
        return <span>{_}</span>;
      },
    },
    {
      width: 100,
      title: '毛利率',
      dataIndex: 'profit',
      key: 'profit',
      render: (_) => {
        return <span>{_ ? parseInt(_ * 100) : ''}%</span>;
      },
    },
    {
      width: 100,
      title: '转换率',
      dataIndex: 'changes',
      key: 'profit',
      render: (_) => {
        return <span>{_ ? parseInt(_ * 100) : ''}%</span>;
      },
    },
  ];

  return (
    <div>
      <Upload {...updateProps} fileList={[]}>
        <Button type="primary" style={{ marginBottom: 10 }}>
          上传文件
        </Button>
      </Upload>
      <div style={{ marginBottom: 10 }}>
        <InputNumber
          value={count}
          min={1500}
          onChange={(val) => setCount(val)}
        />
        <RangePicker
          onChange={onChangeTime}
          format={'YYYY-MM-DD'}
          locale={locale}
        />
        <Button type="primary" onClick={getProductList}>
          搜索
        </Button>
      </div>
      <Table
        loading={loading}
        size="small"
        dataSource={data}
        columns={columns}
        rowKey="id"
        pagination={false}
      ></Table>
    </div>
  );
};

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const useRefData = useRef();
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
      //启动定时器
      useRefData.current = response.data.map((items) => {
        return {
          ...items,
          changes_new: ((items.pay / items.user) * 1).toFixed(2),
        };
      });

      setData(
        response.data.map((items) => {
          return {
            ...items,
            changes_new: ((items.pay / items.user) * 1).toFixed(2),
          };
        })
      );
      setLoading(false);
    }
  };

  const getInterVal = () => {
    setLoading(true);
    let timmer = setInterval(() => {
      if (useRefData.current?.length > 5) {
        let newVal = useRefData.current.splice(0, 5);
        newVal.map((items) => {
          getProductDetail(items.product_id);
        });
      } else if (useRefData.current?.length > 1) {
        let newVal = useRefData.current.splice(0, useRefData.current.length);
        newVal.map((items) => {
          getProductDetail(items.product_id);
        });
      } else {
        setLoading(false);
        clearInterval(timmer);
      }
    }, 1000);
  };

  const getProductDetail = async (id) => {
    const response = await fetch(
      `${window.location.origin}/adminapi/product/product/${id}`,
      {
        headers: {
          'Authori-Zation': `Bearer ${cookie.get('token')}`,
        },
      }
    )
      .then((res) => res.json())
      .catch((err) => {
        message.error('请求量数据太大，请调整', err);
        setLoading(false);
      });

    if (response.status == 200) {
      setData((data) => {
        return data.map((items) => {
          if (items.product_id == response.data.productInfo.id) {
            return {
              ...items,
              sp_price: response.data.productInfo.price,
              cost1: response.data.productInfo.cost,
              href: `http://debo.gonghongzc.com/pages/goods_details/index?id=${items.product_id}`,
              changes_new: ((items.pay / items.user) * 1).toFixed(2),
              profit_new: (
                (response.data.productInfo.price -
                  response.data.productInfo.cost) /
                response.data.productInfo.price
              ).toFixed(2),
            };
          } else {
            return items;
          }
        });
      });
    } else {
      message.error('请求失败');
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

  const exportHandle = () => {
    if (!data.length) {
      message.error('先搜索数据，再导出');
      return;
    }

    const rowXlsxData = [
      '商品ID',
      '商品名称',
      '商品链接',
      '成本',
      '售价',
      '浏览量',
      '访客数',
      '下单数',
      '支付数',
      '支付金额',
      '收藏数',
      '毛利率',
      '转换率',
    ];

    let xlsxData = data.map((items) => {
      return [
        items.product_id,
        items.store_name,
        items.href,
        items.cost1,
        items.sp_price,
        items.visit,
        items.user,
        items.orders,
        items.pay,
        items.price,
        items.collect,
        `${parseInt(items.profit_new * 100)}%`,
        `${parseInt(items.changes_new * 100)}%`,
      ];
    });

    xlsxData.unshift(rowXlsxData);

    // 创建一个工作簿
    const workbook = XLSX.utils.book_new();

    // 创建一个工作表
    const worksheet = XLSX.utils.aoa_to_sheet(xlsxData);

    // 将工作表添加到工作簿中
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // 将工作簿保存为Excel文件
    XLSX.writeFile(workbook, `exported_data_${dayjs().valueOf()}.xlsx`);
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
      dataIndex: 'product_id',
      width: 60,
      key: 'product_id',
    },
    {
      width: 100,
      title: '商品名称',
      dataIndex: 'store_name',
      key: 'store_name',
      render: (_, d) => {
        return (
          <div>
            <p>{_}</p>
            <p>
              <a href={d.href} target="_blank">
                {d.href}
              </a>
            </p>
          </div>
        );
      },
    },
    {
      width: 50,
      title: '成本',
      dataIndex: 'cost1',
      key: 'cost1',
    },
    {
      width: 50,
      title: '售价',
      dataIndex: 'sp_price',
      key: 'sp_price',
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
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.orders - b.orders,
    },
    {
      width: 100,
      title: '支付数',
      dataIndex: 'pay',
      key: 'pay',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.pay - b.pay,
    },
    {
      width: 100,
      title: '支付金额',
      dataIndex: 'price',
      key: 'price',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.price - b.price,
    },
    {
      width: 80,
      title: '收藏数',
      dataIndex: 'collect',
      key: 'collect',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.collect - b.collect,
      render: (_) => {
        return <span>{_}</span>;
      },
    },
    {
      width: 100,
      title: '毛利率',
      dataIndex: 'profit_new',
      key: 'profit_new',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.profit_new - b.profit_new,
      render: (_) => {
        return <span>{_ ? parseInt(_ * 100) : 0}%</span>;
      },
    },
    {
      width: 100,
      title: '转化率',
      dataIndex: 'changes_new',
      key: 'changes_new',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.changes_new - b.changes_new,
      render: (_) => {
        return <span>{_ ? parseInt(_ * 100) : 0}%</span>;
      },
    },
  ];

  return (
    <div>
      {/* <Upload {...updateProps} fileList={[]}>
        <Button type="primary" style={{ marginBottom: 10 }}>
          上传文件
        </Button>
      </Upload> */}
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
        <Button type="primary" onClick={getProductList} disabled={loading}>
          搜索
        </Button>
        <Button
          type="primary"
          onClick={getInterVal}
          disabled={loading}
          style={{ marginLeft: 10 }}
        >
          获取商品信息
        </Button>
        <Button
          disabled={loading}
          type="primary"
          onClick={exportHandle}
          style={{ marginLeft: 10 }}
        >
          导出表格
        </Button>
      </div>
      <Table
        loading={loading}
        size="small"
        dataSource={data}
        columns={columns}
        rowKey="product_id"
        pagination={false}
      ></Table>
    </div>
  );
};

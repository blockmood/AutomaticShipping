import React, { useRef, useState } from 'react';
import { Button } from 'antd';
import cookie from 'cookiejs';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

let flag = true;

export default () => {
  const countRef = useRef(0);
  const pageRef = useRef(1001);
  const exportDataRef = useRef([]);
  const [loading, setLoading] = useState(false);

  const getProductCount = async (page = 1) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', '1');
    params.append('isMarketable', true);
    params.append('warn', '');

    const response = await fetch(
      `${window.location.origin}/Api/CoreCmsGoods/GetPageList`,
      {
        headers: {
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          ...JSON.parse(window.localStorage.getItem('CoreShop')),
        },
        method: 'POST',
        body: params,
      }
    ).then((res) => res.json());
    if (response.code == 0) {
      response.data.map((items) => {
        getProductDetail(items);
      });
    }
  };

  const getProductDetail = async (data) => {
    const response = await fetch(
      `${window.location.origin}/Api/CoreCmsGoods/GetDetails`,
      {
        headers: {
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'Content-Type': 'application/json; charset=UTF-8',
          ...JSON.parse(window.localStorage.getItem('CoreShop')),
        },
        method: 'POST',
        body: JSON.stringify({
          id: data.id,
        }),
      }
    ).then((res) => res.json());

    if (response.code === 0) {
      if (pageRef.current >= 1099) {
        exportData();
        return;
      }

      //遍历数据 拼接到渲染的数据里
      const listData = response.data.products.map((items, index) => {
        return {
          ...items,
          id: index == 0 ? data.id : '',
          name: index == 0 ? data.name : '',
        };
      });
      exportDataRef.current.push(...listData);
      pageRef.current += 1;
      getProductCount(pageRef.current);
    }
  };

  const getIntervalFetchData = () => {
    getProductCount(pageRef.current);
  };

  //导出表格
  const exportData = () => {
    const rowXlsxData = [
      '序列号',
      '商品名称',
      '规格',
      '商品货号',
      '商品售价',
      '成本价',
      '市场价',
    ];

    let xlsxData = exportDataRef.current.map((items) => {
      return [
        items.id,
        items.name,
        items.spesDesc,
        items.sn,
        items.price,
        items.costprice,
        items.mktprice,
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
    XLSX.writeFile(workbook, `exported_product_${dayjs().valueOf()}.xlsx`);

    setLoading(false);
  };

  const exportProduct = async () => {
    setLoading(true);
    getIntervalFetchData();
  };

  return (
    <div>
      <Button onClick={exportProduct} disabled={loading} type="primary">
        {loading ? '正在导出中, 请不要关闭页面' : '点击导出所有商品数据到表格'}
      </Button>
    </div>
  );
};

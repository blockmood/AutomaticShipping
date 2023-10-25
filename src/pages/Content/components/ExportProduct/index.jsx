import React, { useRef, useState } from 'react';
import { Button } from 'antd';
import cookie from 'cookiejs';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

let flag = true;

export default () => {
  const countRef = useRef(0);
  const exportDataRef = useRef([]);
  const [loading, setLoading] = useState(false);

  const getProductCount = async (page = 1) => {
    const response = await fetch(
      `${window.location.origin}/adminapi/product/product?page=${page}&limit=20&cate_id=&type=1&store_name=`,
      {
        headers: {
          'Authori-Zation': `Bearer ${cookie.get('token')}`,
        },
      }
    ).then((res) => res.json());
    if (response.status == 200) {
      if (flag) {
        countRef.current = Math.ceil(response.data.count / 15);
        getIntervalFetchData();
        flag = false;
      }

      exportDataRef.current.push(...response.data.list);
    }
  };

  const getIntervalFetchData = () => {
    var page = 1;
    var timer = setInterval(() => {
      if (page >= countRef.current) {
        clearInterval(timer);
        //导出表格
        exportData();
      } else {
        page++;
        getProductCount(page);
      }
    }, 1000);
  };

  //导出表格
  const exportData = () => {
    const rowXlsxData = [
      '商品ID',
      '商品类型',
      '商品分类',
      '商品名称',
      '商品链接',
      '商品售价',
      '销量',
      '成本',
      '库存',
      '添加时间',
    ];

    let xlsxData = exportDataRef.current.map((items) => {
      return [
        items.id,
        items.product_type,
        items.cate_name,
        items.store_name,
        `http://debo.gonghongzc.com/pages/goods_details/index?id=${items.id}`,
        items.price,
        items.visitor,
        items.cost,
        items.stock,
        `${dayjs(items.add_time * 1000).format('YYYY-MM-DD HH:mm:ss')}`,
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
    await getProductCount();
  };

  return (
    <div>
      <Button onClick={exportProduct} disabled={loading} type="primary">
        {loading ? '正在导出中, 请不要关闭页面' : '点击导出所有商品数据到表格'}
      </Button>
    </div>
  );
};

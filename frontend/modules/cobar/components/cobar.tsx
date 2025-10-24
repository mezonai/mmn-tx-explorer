import { PageHeader, MetricCard, FeatureCard, SectionContainer, SectionHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';

export const Cobar = () => {
  const paymentStats = [
    {
      label: "Đơn hàng bằng MEZ",
      value: "248",
      changePercent: "+18%",
      changeLabel: "24h"
    },
    {
      label: "Tổng MEZ",
      value: "32,480",
      changePercent: "+9.3%"
    },
    {
      label: "Ticket trung bình",
      value: "131 MEZ",
      changePercent: "+2%"
    }
  ];

  // Featured products data
  const featuredProducts = [
    {
      title: "Máy pha cà phê Mezon Barista",
      description: "Giá: 3,200 MEZ • Miễn phí giao hàng toàn quốc • Bonus 120 MEZ khi giới thiệu bạn bè."
    },
    {
      title: "Combo hạt rang specialty",
      description: "Giá: 450 MEZ • Tặng kèm voucher Give Coffee 50 MEZ cho người thân."
    }
  ];

  return (
    <div className="h-full w-full px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Cobar.vn"
        header="Cobar.vn x Mezon Đồng"
        description="Trang giới thiệu tích hợp thương mại điện tử giữa Mezon và Cobar.vn, hiển thị số liệu thanh toán Mezon Đồng, sản phẩm nổi bật và tài liệu API kết nối."
        className="mb-10"
      />
      
      <SectionContainer variant="primary-bg" className="grid gap-[14px] p-7 mb-0">
        <h2 className="text-primary mb-3 p-3 text-2xl font-bold">"Cobar.vn — Mua sắm bằng Mezon Đồng"</h2>
        <p className="text-primary text-md my-2 p-3 font-bold font-semibold">
          Cobar.vn là marketplace chính thức chấp nhận thanh toán bằng Mezon Đồng. Người dùng có thể chọn thanh toán
          trực tiếp bằng Mezon Đồng hoặc thông qua gateway Stripe.
        </p>
        <Button size="lg" variant="default" className="bg-primary/80 text-md font-bold">
          <a href="https://cobar.vn" target="_blank" rel="noopener" className='w-full'>
            Mua ngay tại Cobar.vn
          </a>
        </Button>
      </SectionContainer>

      <SectionContainer>
        <SectionHeader title="Thống kê thanh toán hôm nay" />
        <div className="mb-10 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
          {paymentStats.map((stat, index) => (
            <MetricCard
              key={index}
              label={stat.label}
              value={stat.value}
              changePercent={stat.changePercent}
              changeLabel={stat.changeLabel}
            />
          ))}
        </div>
      </SectionContainer>

      <SectionContainer>
        <SectionHeader title="Sản phẩm nổi bật" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          {featuredProducts.map((product, index) => (
            <FeatureCard
              key={index}
              title={product.title}
              description={product.description}
            />
          ))}
        </div>
      </SectionContainer>
    </div>
  );
};

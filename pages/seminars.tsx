import { GetStaticProps, NextPage } from 'next';
import { supabase } from '@/lib/supabase';
import { Seminar, Industry, Shift } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Clock, MessageCircle } from 'lucide-react';
import { SeminarCarousel } from '@/components/ui/SeminarCarousel';
import Image from 'next/image'; // ★ Imageコンポーネントをインポート

type SeminarsPageProps = {
  seminars: Seminar[];
  industries: Industry[];
};

const SeminarsPage: NextPage<SeminarsPageProps> = ({ seminars, industries }) => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeminar, setSelectedSeminar] = useState<Seminar | null>(null);
  const [seminarShifts, setSeminarShifts] = useState<Shift[]>([]);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const handleScheduleClick = async (seminar: Seminar) => {
    setSelectedSeminar(seminar);
    setIsModalOpen(true);
    setIsModalLoading(true);

    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('seminar_id', seminar.id)
      .in('status', ['申', '済'])
      .order('shift_date', { ascending: true });

    if (error) {
      console.error("シフト日程の取得に失敗", error);
      setSeminarShifts([]);
    } else {
      setSeminarShifts(data || []);
    }
    setIsModalLoading(false);
  };

  const recommendedSeminars = seminars.filter(s => s.is_recommend);

  const filteredSeminars = useMemo(() => {
    if (selectedIndustry === 'all') {
      return seminars;
    }
    return seminars.filter(seminar => seminar.industries?.name === selectedIndustry);
  }, [seminars, selectedIndustry]);

  function getOneHourLater(timeStr: string): string {
    const [hourStr, minuteStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const date = new Date();
    date.setHours(hour, minute);
  
    date.setHours(date.getHours() + 1);
  
    const newHour = String(date.getHours()).padStart(2, '0');
    const newMinute = String(date.getMinutes()).padStart(2, '0');
    return `${newHour}:${newMinute}`;
  }
  

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100">
        <header className="bg-white/80 shadow-sm sticky top-0 z-40 backdrop-blur-md">
          <nav className="container mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold tracking-tight text-gray-800">HR team</h1>
          </nav>
        </header>

        <main className="container mx-auto px-6 py-12">
          
          {recommendedSeminars.length > 0 && (
            <section className="mb-24">
              <h2 className="text-3xl font-bold text-center mb-10">注目セミナー</h2>
              <SeminarCarousel seminars={recommendedSeminars} onSeminarClick={handleScheduleClick} />
            </section>
          )}

          <section>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <h2 className="text-3xl font-bold">セミナー一覧</h2>
              <div className="w-full sm:w-auto sm:min-w-[200px]">
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger>
                    <SelectValue placeholder="業界で絞り込む" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての業界</SelectItem>
                    {industries.map(industry => (
                      <SelectItem key={industry.id} value={industry.name}>{industry.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {filteredSeminars.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSeminars.map(seminar => (
                  <Card key={seminar.id} className="flex flex-col h-full overflow-hidden transition-transform hover:-translate-y-2 duration-300 shadow-lg hover:shadow-xl border-t-4 border-t-primary/80">
                    <CardHeader className="p-0">
                        {/* ★★★ ここを<Image>に修正 ★★★ */}
                        <Image
                            src={seminar.banner_url || 'https://placehold.co/400x225/e2e8f0/e2e8f0'} 
                            alt={seminar.title}
                            width={400}
                            height={225}
                            className="w-full h-44 object-cover"
                        />
                    </CardHeader>
                    <CardContent className="flex-grow p-4">
                        <CardTitle className="text-lg mb-2 line-clamp-2 h-[56px] font-bold">{seminar.title}</CardTitle>
                        <div className="flex flex-wrap gap-2">
                            {seminar.industries?.name && <Badge variant="secondary">{seminar.industries.name}</Badge>}
                            {seminar.online && <Badge variant="outline">オンライン</Badge>}
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 mt-auto">
                        <Button className="w-full" onClick={() => handleScheduleClick(seminar)}>開催日程を確認する</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
                <p className="text-center text-muted-foreground mt-8">該当するセミナーはありません。</p>
            )}
          </section>
        </main>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{selectedSeminar?.title}</DialogTitle>
            <DialogDescription>開催日程をご確認の上、LINEからご予約ください。</DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground py-4 border-y">
            <h3 className="font-semibold text-foreground mb-2">セミナー概要</h3>
            <p className="whitespace-pre-wrap">
              {selectedSeminar?.description || '概要がありません。'}
            </p>
          </div>
          <div className="max-h-[40vh] overflow-y-auto p-1 pr-4">
            <h3 className="font-semibold text-foreground mb-2">開催日程</h3>
            {isModalLoading ? (
              <p>日程を読み込み中...</p>
            ) : seminarShifts.length > 0 ? (
              <div className="space-y-3">
                {seminarShifts.map(shift => (
                  <div key={shift.id} className="flex items-center gap-4 p-3 bg-muted rounded-md">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-semibold">{new Date(shift.shift_date).toLocaleDateString('ja-JP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {shift.shift_time
  ? `${shift.shift_time.slice(0, 5)} - ${getOneHourLater(shift.shift_time)}`
  : '-'}

                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>現在予約可能な日程はありません。</p>
            )}
          </div>
          <DialogFooter>
            {selectedSeminar?.line_url ? (
              <a href={selectedSeminar.line_url} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button className="w-full bg-[#06C755] hover:bg-[#06B54D] text-white">
                  <MessageCircle className="h-5 w-5 mr-2" /> LINEで予約する
                </Button>
              </a>
            ) : (
              <Button className="w-full" disabled>LINE URLが設定されていません</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SeminarsPage;

export const getStaticProps: GetStaticProps = async () => {
  const [seminarsRes, industriesRes] = await Promise.all([
    supabase.from('seminars').select('*, users ( name ), industries ( name )').order('created_at', { ascending: false }),
    supabase.from('industries').select('id, name')
  ]);

  if (seminarsRes.error || industriesRes.error) {
    console.error('データ取得エラー:', seminarsRes.error || industriesRes.error);
    return { props: { seminars: [], industries: [] } };
  }

  return {
    props: {
      seminars: seminarsRes.data,
      industries: industriesRes.data,
    },
    revalidate: 60,
  };
};
```
8 subcarriers   
3 bit/baud (PSK-8)
3 baud (120ms symbol, 213.3ms guard)     14700 = 5292 + 9408  (@44100)
=
72 bit/sec = 9 B/sec       ->   1,125 B/sec per subcarrier

SYNC_ZERO | ADDR_SRC | ADDR_DEST | LENGTH | data .... data | SHA1[first 2 bytes] | ECC
            1 B         1 B          1 B       0...255 B         2 B
            
            
frame format:

       1      2      3      4      5      6      7      8      9      10     11  
    |      |      |      |      |      |      |      |      |      |      |      |
    | SRC DST LEN | data...data |     MD5     |     PAD     |     Reed-Solomon checksum
    
    
     000000 000000 0000
      6bit   6bit  4bit
      
      SRC - 64 dirrerent adresses 00..3F
      DST - 64 dirrerent adresses 00..3F
      LEN - 16 bytes max in payload

```